/**
 * MemoListPage - 메모 목록 페이지
 * 메모 카드 목록, 검색, 필터, 정렬, 페이지네이션 지원
 */

import { useEffect } from 'react';
import { useMemoStore } from '@/stores/memoStore';
import { MemoCard, MemoListSidebar, Loading, Empty, ErrorMessage, Pagination } from '@/components';

export function MemoListPage() {
  const {
    memos,
    total,
    page,
    total_pages,
    isLoading,
    error,
    filters,
    fetchMemos,
    setPage,
    clearError,
  } = useMemoStore();

  // 초기 로딩
  useEffect(() => {
    fetchMemos();
  }, [fetchMemos]);

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchMemos({ page: newPage });
    // 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex gap-8">
      {/* 사이드바 */}
      <MemoListSidebar />

      {/* 메인 콘텐츠 */}
      <main className="flex-1 min-w-0">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              메모 목록
            </h1>
            {total > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                총 {total}개의 메모
                {filters.search && ` • "${filters.search}" 검색 결과`}
                {filters.tag && ` • #${filters.tag} 필터`}
              </p>
            )}
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6">
            <ErrorMessage
              message={error}
              onRetry={() => {
                clearError();
                fetchMemos();
              }}
            />
          </div>
        )}

        {/* 로딩 상태 */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loading size="lg" text="메모를 불러오는 중..." />
          </div>
        )}

        {/* 메모 목록 */}
        {!isLoading && memos.length > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {memos.map((memo) => (
                <MemoCard key={memo.id} memo={memo} />
              ))}
            </div>

            {/* 페이지네이션 */}
            {total_pages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={page}
                  totalPages={total_pages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}

        {/* 빈 상태 */}
        {!isLoading && memos.length === 0 && !error && (
          <Empty
            icon="📝"
            title={filters.search || filters.tag ? '검색 결과가 없습니다' : '아직 메모가 없습니다'}
            description={
              filters.search || filters.tag
                ? '다른 검색어나 필터를 시도해보세요.'
                : '첫 번째 메모를 작성하여 지식의 별을 만들어보세요.'
            }
            action={
              filters.search || filters.tag
                ? undefined
                : { label: '새 메모 작성', to: '/memos/new' }
            }
          />
        )}
      </main>
    </div>
  );
}
