/**
 * Connections API Client
 * 메모 연결 관리 API 호출 함수들
 */

import { apiClient } from './client';
import type {
  CreateConnectionRequest,
  DeleteConnectionRequest,
  ConnectionListResponse,
} from '@/types';

/**
 * 연결 생성
 */
export async function createConnection(
  request: CreateConnectionRequest
): Promise<{ message: string; source_id: string; target_id: string }> {
  const { data } = await apiClient.post('/api/connections', request);
  return data;
}

/**
 * 연결 삭제
 */
export async function deleteConnection(
  request: DeleteConnectionRequest
): Promise<{ message: string; source_id: string; target_id: string }> {
  const { data } = await apiClient.delete('/api/connections', {
    data: request,
  });
  return data;
}

/**
 * 메모의 연결 목록 조회
 */
export async function getMemoConnections(
  memoId: string
): Promise<ConnectionListResponse> {
  const { data } = await apiClient.get<ConnectionListResponse>(
    `/api/connections/${memoId}`
  );
  return data;
}
