/**
 * Memo API Client
 * 메모 CRUD API 호출 함수들
 */

import { apiClient } from './client';
import type {
  Memo,
  CreateMemoRequest,
  UpdateMemoRequest,
  PaginatedResponse,
} from '@/types';

// 메모 목록 조회 파라미터
export interface GetMemosParams {
  page?: number;
  limit?: number;
  sort?: 'created_at' | 'updated_at' | 'connection_count' | 'title';
  order?: 'asc' | 'desc';
  tag?: string;
  search?: string;
}

/**
 * 메모 목록 조회
 */
export async function getMemos(
  params: GetMemosParams = {}
): Promise<PaginatedResponse<Memo>> {
  const { data } = await apiClient.get<PaginatedResponse<Memo>>('/api/memos', {
    params: {
      page: params.page || 1,
      limit: params.limit || 20,
      sort: params.sort || 'created_at',
      order: params.order || 'desc',
      ...(params.tag && { tag: params.tag }),
      ...(params.search && { search: params.search }),
    },
  });
  return data;
}

/**
 * 메모 상세 조회
 */
export async function getMemo(id: string): Promise<Memo> {
  const { data } = await apiClient.get<Memo>(`/api/memos/${id}`);
  return data;
}

/**
 * 메모 생성
 */
export async function createMemo(memoData: CreateMemoRequest): Promise<Memo> {
  const { data } = await apiClient.post<Memo>('/api/memos', memoData);
  return data;
}

/**
 * 메모 수정
 */
export async function updateMemo(
  id: string,
  memoData: UpdateMemoRequest
): Promise<Memo> {
  const { data } = await apiClient.put<Memo>(`/api/memos/${id}`, memoData);
  return data;
}

/**
 * 메모 삭제
 */
export async function deleteMemo(
  id: string
): Promise<{ message: string; deleted_id: string; deleted_zettel_id: string }> {
  const { data } = await apiClient.delete(`/api/memos/${id}`);
  return data;
}
