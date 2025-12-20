/**
 * Suggestion API Client
 * 연결 제안 API 호출 함수들
 */

import { apiClient } from './client';
import type { SuggestionListResponse, SuggestionActionResponse } from '@/types';

/**
 * 메모에 대한 연결 제안 조회
 * @param memoId 제안을 받을 메모 ID
 * @param limit 제안 개수 (기본값: 10, 최대: 20)
 * @param threshold 유사도 임계값 (기본값: 0.5)
 */
export async function getSuggestions(
  memoId: string,
  limit: number = 10,
  threshold: number = 0.5
): Promise<SuggestionListResponse> {
  const { data } = await apiClient.get<SuggestionListResponse>(
    `/api/memos/${memoId}/suggestions`,
    {
      params: { limit, threshold },
    }
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
