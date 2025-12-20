"""
LLM Service for connection evaluation.
Ollama API를 사용하여 메모 간 연결 가치를 평가합니다.
"""

import httpx
import json
import re
from typing import Optional

from app.config import get_settings

settings = get_settings()

# Ollama API 엔드포인트
OLLAMA_API_URL = f"{settings.ollama_base_url}/api/generate"

# 연결 평가 프롬프트 (Solar Pro 22B 최적화)
EVALUATION_PROMPT = """두 메모의 연결 가치를 평가하세요.

메모A 제목: {title_a}
메모A 내용: {content_a}

메모B 제목: {title_b}
메모B 내용: {content_b}

연결 가치가 있으면 높은 점수, 없으면 낮은 점수를 주세요.
JSON 형식으로만 응답: {{"score": 0.8, "reason": "공통 주제", "connected": true}}"""


async def evaluate_connection(
    title_a: str,
    content_a: str,
    title_b: str,
    content_b: str,
    timeout: float = 60.0,
) -> dict:
    """
    두 메모 간의 연결 가치를 LLM으로 평가합니다.

    Args:
        title_a: 메모 A 제목
        content_a: 메모 A 내용
        title_b: 메모 B 제목
        content_b: 메모 B 내용
        timeout: API 타임아웃 (초)

    Returns:
        {
            "score": float (0.0~1.0),
            "reason": str,
            "connected": bool,
            "error": Optional[str]
        }
    """
    # 내용 길이 제한 (토큰 절약)
    max_content_length = 500
    content_a_trimmed = content_a[:max_content_length] if len(content_a) > max_content_length else content_a
    content_b_trimmed = content_b[:max_content_length] if len(content_b) > max_content_length else content_b

    prompt = EVALUATION_PROMPT.format(
        title_a=title_a,
        content_a=content_a_trimmed,
        title_b=title_b,
        content_b=content_b_trimmed,
    )

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                OLLAMA_API_URL,
                json={
                    "model": settings.ollama_model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.3,  # 일관된 응답을 위해 낮은 temperature
                        "num_predict": 100,  # 짧은 JSON 응답용
                    },
                },
            )
            response.raise_for_status()

            result = response.json()
            response_text = result.get("response", "")

            # JSON 파싱
            return parse_llm_response(response_text)

    except httpx.TimeoutException:
        return {
            "score": 0.0,
            "reason": "LLM 응답 시간 초과",
            "connected": False,
            "error": "timeout",
        }
    except httpx.HTTPStatusError as e:
        return {
            "score": 0.0,
            "reason": "LLM API 오류",
            "connected": False,
            "error": f"http_error: {e.response.status_code}",
        }
    except Exception as e:
        return {
            "score": 0.0,
            "reason": "LLM 평가 실패",
            "connected": False,
            "error": str(e),
        }


def parse_llm_response(response_text: str) -> dict:
    """
    LLM 응답에서 JSON을 파싱합니다.
    다양한 LLM 형식 지원 (EXAONE 3.5, Deep 등).
    """
    try:
        # <thought> 태그 이후의 내용에서 JSON 추출
        # EXAONE Deep는 <thought>...</thought> 후 답변을 출력
        text = response_text
        if "</thought>" in text:
            text = text.split("</thought>")[-1]

        # JSON 블록 추출 시도
        json_match = re.search(r'\{[^{}]*\}', text, re.DOTALL)
        if json_match:
            json_str = json_match.group()
            data = json.loads(json_str)

            score = float(data.get("score", 0.0))
            score = max(0.0, min(1.0, score))  # 0~1 범위로 클램핑

            return {
                "score": score,
                "reason": str(data.get("reason", ""))[:100],  # 100자 제한
                "connected": bool(data.get("connected", score >= 0.5)),
                "error": None,
            }

        # JSON이 없으면 점수 키워드 검색 (fallback)
        if "연결" in response_text and ("있" in response_text or "높" in response_text):
            return {
                "score": 0.7,
                "reason": "AI가 연결 가치를 인정",
                "connected": True,
                "error": None,
            }

    except (json.JSONDecodeError, ValueError, KeyError):
        pass

    # 파싱 실패 시 기본값 (벡터 기준 사용)
    return {
        "score": 0.0,
        "reason": "응답 파싱 실패",
        "connected": False,
        "error": "parse_error",
    }


async def batch_evaluate_connections(
    source_memo: dict,
    candidates: list[dict],
    timeout_per_eval: float = 60.0,
    use_cache: bool = True,
) -> list[dict]:
    """
    여러 후보 메모에 대해 연결 가치를 배치 평가합니다.
    캐시가 있으면 캐시된 결과를 사용합니다.

    Args:
        source_memo: 소스 메모 {"id": str, "title": str, "content": str}
        candidates: 후보 메모 목록 [{"id": str, "title": str, "content": str, "similarity": float}, ...]
        timeout_per_eval: 각 평가의 타임아웃
        use_cache: 캐시 사용 여부 (기본값: True)

    Returns:
        평가 결과 목록 (similarity와 llm_score 포함)
    """
    from app.services.job_service import get_cached_evaluation, save_evaluation_cache

    results = []
    source_id = source_memo.get("id", "")

    for candidate in candidates:
        candidate_id = candidate.get("id", "")
        cached = None

        # 캐시 확인
        if use_cache and source_id and candidate_id:
            cached = get_cached_evaluation(source_id, candidate_id)

        if cached:
            # 캐시된 결과 사용
            eval_result = {
                "score": cached["score"],
                "reason": cached["reason"],
                "connected": cached["connected"],
                "error": None,
            }
        else:
            # LLM 평가 수행
            eval_result = await evaluate_connection(
                title_a=source_memo.get("title", ""),
                content_a=source_memo.get("content", ""),
                title_b=candidate.get("title", ""),
                content_b=candidate.get("content", ""),
                timeout=timeout_per_eval,
            )

            # 캐시 저장 (에러 없을 때만)
            if use_cache and source_id and candidate_id and not eval_result.get("error"):
                save_evaluation_cache(
                    source_id=source_id,
                    target_id=candidate_id,
                    score=eval_result.get("score", 0.0),
                    reason=eval_result.get("reason", ""),
                    connected=eval_result.get("connected", False),
                )

        # 하이브리드 점수 계산 (벡터 유사도 40% + LLM 점수 60%)
        vector_similarity = candidate.get("similarity", 0.0)
        llm_score = eval_result.get("score", 0.0)
        hybrid_score = (vector_similarity * 0.4) + (llm_score * 0.6)

        results.append({
            "id": candidate.get("id"),
            "title": candidate.get("title"),
            "zettel_id": candidate.get("zettel_id", ""),
            "content_preview": candidate.get("content", "")[:200],
            "vector_similarity": vector_similarity,
            "llm_score": llm_score,
            "hybrid_score": hybrid_score,
            "reason": eval_result.get("reason", ""),
            "connected": eval_result.get("connected", False),
            "error": eval_result.get("error"),
            "cached": cached is not None,
        })

    # 하이브리드 점수로 정렬
    results.sort(key=lambda x: x["hybrid_score"], reverse=True)

    return results


async def check_ollama_health() -> dict:
    """
    Ollama 서비스 상태를 확인합니다.
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # 모델 목록 조회로 상태 확인
            response = await client.get(f"{settings.ollama_base_url}/api/tags")
            response.raise_for_status()

            data = response.json()
            models = [m.get("name") for m in data.get("models", [])]

            return {
                "status": "healthy",
                "model": settings.ollama_model,
                "available_models": models,
                "model_loaded": settings.ollama_model in models or any(
                    settings.ollama_model.split(":")[0] in m for m in models
                ),
            }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
        }
