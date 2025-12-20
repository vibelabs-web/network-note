/**
 * Suggestion API Client
 * 연결 제안 API 호출 함수들
 */

import { apiClient } from './client';
import type {
  SuggestionListResponse,
  SuggestionActionResponse,
  RefineResponse,
  JobStatusResponse,
} from '@/types';

/**
 * 메모에 대한 연결 제안 조회
 * @param memoId 제안을 받을 메모 ID
 * @param limit 제안 개수 (기본값: 10, 최대: 20)
 * @param threshold 유사도 임계값 (기본값: 0.5)
 * @param useLlm LLM 평가 사용 여부 (기본값: true)
 */
export async function getSuggestions(
  memoId: string,
  limit: number = 10,
  threshold: number = 0.5,
  useLlm: boolean = true
): Promise<SuggestionListResponse> {
  const { data } = await apiClient.get<SuggestionListResponse>(
    `/api/memos/${memoId}/suggestions`,
    {
      params: { limit, threshold, useLlm },
    }
  );
  return data;
}

/**
 * LLM으로 제안을 비동기 재평가
 * @param memoId 제안을 받을 메모 ID
 * @param candidateIds 재평가할 후보 메모 ID 목록 (없으면 벡터 검색으로 자동 선정)
 * @param limit 재평가할 최대 후보 수 (기본값: 10)
 * @param threshold 벡터 유사도 임계값 (기본값: 0.5)
 */
export async function refineSuggestions(
  memoId: string,
  candidateIds?: string[],
  limit: number = 10,
  threshold: number = 0.5
): Promise<RefineResponse> {
  const { data } = await apiClient.post<RefineResponse>(
    '/api/suggestions/refine',
    {
      memoId,
      candidateIds,
      limit,
      threshold,
    }
  );
  return data;
}

/**
 * 비동기 작업 상태 조회
 * @param jobId 작업 ID
 */
export async function getSuggestionStatus(jobId: string): Promise<JobStatusResponse> {
  const { data } = await apiClient.get<JobStatusResponse>(
    `/api/suggestions/status/${jobId}`
  );
  return data;
}

/**
 * 제안된 연결 승인
 * @param sourceId 제안을 받은 메모 ID
 * @param targetId 제안된 메모 ID
 */
export async function approveSuggestion(
  sourceId: string,
  targetId: string
): Promise<SuggestionActionResponse> {
  const { data } = await apiClient.post<SuggestionActionResponse>(
    '/api/suggestions/approve',
    { sourceId, targetId }
  );
  return data;
}

/**
 * 제안된 연결 거부
 * @param sourceId 제안을 받은 메모 ID
 * @param targetId 거부할 메모 ID
 * @param reason 거부 이유 (선택)
 */
export async function rejectSuggestion(
  sourceId: string,
  targetId: string,
  reason?: string
): Promise<SuggestionActionResponse> {
  const { data } = await apiClient.post<SuggestionActionResponse>(
    '/api/suggestions/reject',
    { sourceId, targetId, reason }
  );
  return data;
}
