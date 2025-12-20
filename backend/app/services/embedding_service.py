"""
Embedding Service.
텍스트를 벡터로 변환하는 임베딩 서비스입니다.
Sentence Transformers (paraphrase-multilingual-MiniLM-L12-v2) 모델을 사용합니다.
한국어를 포함한 50+ 언어를 지원합니다.
"""

from sentence_transformers import SentenceTransformer

from app.config import get_settings

# Global model instance
_model: SentenceTransformer | None = None


def get_model() -> SentenceTransformer:
    """
    Get or create embedding model instance.
    싱글톤 패턴으로 모델 인스턴스를 관리합니다.

    모델 정보 (paraphrase-multilingual-MiniLM-L12-v2):
    - 출력 차원: 384
    - 최대 입력 토큰: 128
    - 50+ 언어 지원 (한국어, 영어, 일본어 등)
    - 빠르고 가벼운 다국어 모델
    """
    global _model
    if _model is None:
        settings = get_settings()
        _model = SentenceTransformer(settings.embedding_model)
    return _model


def check_model_loaded() -> dict:
    """
    Check if embedding model is loaded.

    Returns:
        dict: Model status with 'loaded' boolean and model info.
    """
    try:
        model = get_model()
        return {
            "loaded": True,
            "model_name": get_settings().embedding_model,
            "embedding_dimension": model.get_sentence_embedding_dimension(),
        }
    except Exception as e:
        return {
            "loaded": False,
            "error": f"Model loading failed: {str(e)}",
        }


def create_embedding(text: str) -> list[float]:
    """
    텍스트를 임베딩 벡터로 변환합니다.

    Args:
        text: 변환할 텍스트

    Returns:
        384차원 임베딩 벡터
    """
    if not text or not text.strip():
        # 빈 텍스트는 제로 벡터 반환
        model = get_model()
        dim = model.get_sentence_embedding_dimension()
        return [0.0] * dim

    model = get_model()
    embedding = model.encode(text, convert_to_numpy=True)
    return embedding.tolist()


def create_embeddings(texts: list[str]) -> list[list[float]]:
    """
    여러 텍스트를 배치로 임베딩 벡터로 변환합니다.

    Args:
        texts: 변환할 텍스트 목록

    Returns:
        384차원 임베딩 벡터 목록
    """
    if not texts:
        return []

    model = get_model()
    dim = model.get_sentence_embedding_dimension()

    # 빈 텍스트 처리
    processed_texts = []
    empty_indices = []
    for i, text in enumerate(texts):
        if text and text.strip():
            processed_texts.append(text)
        else:
            empty_indices.append(i)
            processed_texts.append("")

    # 배치 임베딩 생성
    embeddings = model.encode(processed_texts, convert_to_numpy=True)

    # 빈 텍스트는 제로 벡터로 대체
    result = []
    for i, emb in enumerate(embeddings):
        if i in empty_indices:
            result.append([0.0] * dim)
        else:
            result.append(emb.tolist())

    return result


def create_memo_embedding(title: str, content: str) -> list[float]:
    """
    메모의 제목과 내용을 결합하여 임베딩을 생성합니다.

    제목에 더 높은 가중치를 주기 위해 제목을 앞에 배치합니다.

    Args:
        title: 메모 제목
        content: 메모 내용

    Returns:
        384차원 임베딩 벡터
    """
    # 제목과 내용 결합 (제목에 가중치를 주기 위해 앞에 배치)
    combined_text = f"{title}\n\n{content}" if content else title
    return create_embedding(combined_text)


def get_embedding_dimension() -> int:
    """
    임베딩 벡터의 차원을 반환합니다.
    """
    model = get_model()
    return model.get_sentence_embedding_dimension()
