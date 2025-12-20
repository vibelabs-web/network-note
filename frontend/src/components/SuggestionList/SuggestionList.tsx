/**
 * SuggestionList - 연결 제안 목록 컴포넌트
 * 메모에 대한 연결 제안을 목록으로 표시하고 관리하는 컴포넌트
 */

import { useEffect, useState, useCallback } from 'react';
import { SuggestionCard } from '@/components/SuggestionCard';
import type { SuggestionItem } from '@/types';
import { getSuggestions, approveSuggestion, rejectSuggestion } from '@/api/suggestions';

interface SuggestionListProps {
  memoId: string;
  onConnectionCreated?: () => void;
}

// 스켈레톤 로더 컴포넌트
function SuggestionSkeleton() {
  return (
    <div className="bg-[#2d2d2d] border border-[#3c3c3c] rounded-lg p-3 animate-pulse">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="h-4 bg-[#3c3c3c] rounded w-3/4 mb-1.5" />
          <div className="h-3 bg-[#3c3c3c] rounded w-1/3" />
        </div>
      </div>
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="h-3 bg-[#3c3c3c] rounded w-12" />
          <div className="h-3 bg-[#3c3c3c] rounded w-16" />
        </div>
        <div className="h-1.5 bg-[#3c3c3c] rounded-full" />
      </div>
      <div className="h-3 bg-[#3c3c3c] rounded w-full mb-3" />
      <div className="flex items-center gap-2">
        <div className="flex-1 h-7 bg-[#3c3c3c] rounded" />
        <div className="w-7 h-7 bg-[#3c3c3c] rounded" />
      </div>
    </div>
  );
}

export function SuggestionList({ memoId, onConnectionCreated }: SuggestionListProps) {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());

  // 제안 목록 로드
  const loadSuggestions = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await getSuggestions(memoId, 10, 0.3);
      setSuggestions(response.suggestions);
      setProcessedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : '제안을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [memoId]);

  // 초기 로드
  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  // 제안 승인
  const handleApprove = useCallback(async (targetId: string) => {
    try {
      const response = await approveSuggestion(memoId, targetId);
      if (response.success) {
        // 목록에서 제거
        setSuggestions(prev => prev.filter(s => s.memoId !== targetId));
        setProcessedIds(prev => new Set(prev).add(targetId));
        // 연결 생성 콜백
        onConnectionCreated?.();
      }
    } catch (err) {
      console.error('제안 승인 실패:', err);
      throw err;
    }
  }, [memoId, onConnectionCreated]);

  // 제안 거부
  const handleReject = useCallback(async (targetId: string) => {
    try {
      const response = await rejectSuggestion(memoId, targetId);
      if (response.success) {
        // 목록에서 제거
        setSuggestions(prev => prev.filter(s => s.memoId !== targetId));
        setProcessedIds(prev => new Set(prev).add(targetId));
      }
    } catch (err) {
      console.error('제안 거부 실패:', err);
      throw err;
    }
  }, [memoId]);

  // 새로고침
  const handleRefresh = () => {
    loadSuggestions(true);
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            연결 제안
          </h3>
        </div>
        <div className="space-y-2">
          <SuggestionSkeleton />
          <SuggestionSkeleton />
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            연결 제안
          </h3>
        </div>
        <div className="bg-[#2d2d2d] border border-red-500/30 rounded-lg p-4 text-center">
          <p className="text-sm text-red-400 mb-3">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 text-xs bg-[#3c3c3c] hover:bg-[#4c4c4c] text-gray-300 rounded transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 빈 상태
  if (suggestions.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            연결 제안
          </h3>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1 text-gray-500 hover:text-gray-300 hover:bg-[#3c3c3c] rounded transition-colors disabled:opacity-50"
            title="새로고침"
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <div className="bg-[#2d2d2d] border border-[#3c3c3c] rounded-lg p-4 text-center">
          <svg className="w-8 h-8 mx-auto text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <p className="text-sm text-gray-500 mb-1">제안할 연결이 없습니다</p>
          <p className="text-xs text-gray-600">더 많은 메모를 작성하면 AI가 연결을 제안합니다</p>
        </div>
      </div>
    );
  }

  // 제안 목록 표시
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          연결 제안
          <span className="text-gray-500 font-normal">({suggestions.length})</span>
        </h3>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-1 text-gray-500 hover:text-gray-300 hover:bg-[#3c3c3c] rounded transition-colors disabled:opacity-50"
          title="새로고침"
        >
          <svg
            className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      <div className="space-y-2">
        {suggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.memoId}
            suggestion={suggestion}
            onApprove={handleApprove}
            onReject={handleReject}
            isProcessing={processedIds.has(suggestion.memoId)}
          />
        ))}
      </div>
    </div>
  );
}
