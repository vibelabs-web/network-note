/**
 * Memo Store - Zustand 상태 관리
 * 메모 목록, 선택된 메모, CRUD 액션 관리
 */

import { create } from 'zustand';
import type { Memo, CreateMemoRequest, UpdateMemoRequest } from '@/types';
import {
  getMemos,
  getMemo,
  createMemo,
  updateMemo,
  deleteMemo,
  type GetMemosParams,
} from '@/api/memos';

interface MemoState {
  // 메모 목록 상태
  memos: Memo[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;

  // 현재 선택된 메모
  currentMemo: Memo | null;

  // 필터 및 정렬 상태
  filters: {
    search: string;
    tag: string;
    sort: 'created_at' | 'updated_at' | 'connection_count' | 'title';
    order: 'asc' | 'desc';
  };

  // 로딩 및 에러 상태
  isLoading: boolean;
  isLoadingDetail: boolean;
  isSaving: boolean;
  error: string | null;

  // 액션
  fetchMemos: (params?: GetMemosParams) => Promise<void>;
  fetchMemo: (id: string) => Promise<void>;
  createMemo: (data: CreateMemoRequest) => Promise<Memo>;
  updateMemo: (id: string, data: UpdateMemoRequest) => Promise<Memo>;
  deleteMemo: (id: string) => Promise<void>;

  // 필터 액션
  setSearch: (search: string) => void;
  setTag: (tag: string) => void;
  setSort: (sort: 'created_at' | 'updated_at' | 'connection_count' | 'title') => void;
  setOrder: (order: 'asc' | 'desc') => void;
  setPage: (page: number) => void;

  // 유틸리티 액션
  clearCurrentMemo: () => void;
  clearError: () => void;
}

export const useMemoStore = create<MemoState>((set, get) => ({
  // 초기 상태
  memos: [],
  total: 0,
  page: 1,
  page_size: 20,
  total_pages: 1,
  currentMemo: null,
  filters: {
    search: '',
    tag: '',
    sort: 'created_at',
    order: 'desc',
  },
  isLoading: false,
  isLoadingDetail: false,
  isSaving: false,
  error: null,

  // 메모 목록 조회
  fetchMemos: async (params?: GetMemosParams) => {
    set({ isLoading: true, error: null });
    try {
      const { filters, page, page_size } = get();
      const response = await getMemos({
        page: params?.page ?? page,
        limit: params?.limit ?? page_size,
        sort: params?.sort ?? filters.sort,
        order: params?.order ?? filters.order,
        tag: (params?.tag ?? filters.tag) || undefined,
        search: (params?.search ?? filters.search) || undefined,
      });
      set({
        memos: response.items,
        total: response.total,
        page: response.page,
        page_size: response.page_size,
        total_pages: response.total_pages,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '메모 목록을 불러오는데 실패했습니다.',
      });
    }
  },

  // 메모 상세 조회
  fetchMemo: async (id: string) => {
    set({ isLoadingDetail: true, error: null });
    try {
      const memo = await getMemo(id);
      set({ currentMemo: memo, isLoadingDetail: false });
    } catch (error) {
      set({
        isLoadingDetail: false,
        error: error instanceof Error ? error.message : '메모를 불러오는데 실패했습니다.',
      });
    }
  },

  // 메모 생성
  createMemo: async (data: CreateMemoRequest) => {
    set({ isSaving: true, error: null });
    try {
      const newMemo = await createMemo(data);
      set({ isSaving: false, currentMemo: newMemo });
      // 목록 갱신
      get().fetchMemos();
      return newMemo;
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : '메모 생성에 실패했습니다.',
      });
      throw error;
    }
  },

  // 메모 수정
  updateMemo: async (id: string, data: UpdateMemoRequest) => {
    set({ isSaving: true, error: null });
    try {
      const updatedMemo = await updateMemo(id, data);
      set({ isSaving: false, currentMemo: updatedMemo });
      // 목록 갱신
      get().fetchMemos();
      return updatedMemo;
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : '메모 수정에 실패했습니다.',
      });
      throw error;
    }
  },

  // 메모 삭제
  deleteMemo: async (id: string) => {
    set({ isSaving: true, error: null });
    try {
      await deleteMemo(id);
      set({ isSaving: false, currentMemo: null });
      // 목록 갱신
      get().fetchMemos();
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : '메모 삭제에 실패했습니다.',
      });
      throw error;
    }
  },

  // 필터 액션
  setSearch: (search: string) => {
    set((state) => ({
      filters: { ...state.filters, search },
      page: 1, // 검색 시 첫 페이지로
    }));
  },

  setTag: (tag: string) => {
    set((state) => ({
      filters: { ...state.filters, tag },
      page: 1,
    }));
  },

  setSort: (sort: 'created_at' | 'updated_at' | 'connection_count' | 'title') => {
    set((state) => ({ filters: { ...state.filters, sort } }));
  },

  setOrder: (order: 'asc' | 'desc') => {
    set((state) => ({ filters: { ...state.filters, order } }));
  },

  setPage: (page: number) => {
    set({ page });
  },

  // 유틸리티 액션
  clearCurrentMemo: () => {
    set({ currentMemo: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));
