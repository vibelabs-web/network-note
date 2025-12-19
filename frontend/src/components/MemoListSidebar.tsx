/**
 * MemoListSidebar 컴포넌트
 * 메모 목록 페이지의 사이드바 (검색, 태그 필터, 정렬)
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useMemoStore } from '@/stores/memoStore';
import { Tag } from './common';

// 정렬 옵션
const sortOptions = [
  { value: 'created_at', label: '최신순' },
  { value: 'updated_at', label: '수정순' },
  { value: 'connection_count', label: '연결순' },
  { value: 'title', label: '제목순' },
] as const;

// 자주 사용되는 태그 예시 (추후 API에서 가져올 수 있음)
const popularTags = ['아이디어', '할일', '참고', '프로젝트', '학습'];

export function MemoListSidebar() {
  const {
    filters,
    setSearch,
    setTag,
    setSort,
    setOrder,
    fetchMemos,
  } = useMemoStore();

  const [searchInput, setSearchInput] = useState(filters.search);

  // 디바운스된 검색
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setSearch(searchInput);
        fetchMemos({ search: searchInput || undefined });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search, setSearch, fetchMemos]);

  // 태그 클릭 핸들러
  const handleTagClick = useCallback((tag: string) => {
    const newTag = filters.tag === tag ? '' : tag;
    setTag(newTag);
    fetchMemos({ tag: newTag || undefined });
  }, [filters.tag, setTag, fetchMemos]);

  // 정렬 변경 핸들러
  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as typeof filters.sort;
    setSort(value);
    fetchMemos({ sort: value });
  }, [setSort, fetchMemos]);

  // 정렬 방향 토글
  const handleOrderToggle = useCallback(() => {
    const newOrder = filters.order === 'desc' ? 'asc' : 'desc';
    setOrder(newOrder);
    fetchMemos({ order: newOrder });
  }, [filters.order, setOrder, fetchMemos]);

  return (
    <aside className="w-64 flex-shrink-0 space-y-6">
      {/* 새 메모 버튼 */}
      <Link
        to="/memos/new"
        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span>새 메모</span>
      </Link>

      {/* 검색 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          검색
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="제목, 내용 검색..."
            className="w-full px-4 py-2 pl-10 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('');
                setSearch('');
                fetchMemos({ search: undefined });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 정렬 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          정렬
        </label>
        <div className="flex gap-2">
          <select
            value={filters.sort}
            onChange={handleSortChange}
            className="flex-1 px-3 py-2 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleOrderToggle}
            className="px-3 py-2 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title={filters.order === 'desc' ? '내림차순' : '오름차순'}
          >
            {filters.order === 'desc' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 태그 필터 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          태그 필터
        </label>
        <div className="flex flex-wrap gap-2">
          {popularTags.map((tag) => (
            <Tag
              key={tag}
              label={tag}
              onClick={() => handleTagClick(tag)}
              isActive={filters.tag === tag}
              size="md"
            />
          ))}
        </div>
        {filters.tag && (
          <button
            onClick={() => {
              setTag('');
              fetchMemos({ tag: undefined });
            }}
            className="mt-2 text-xs text-primary-500 hover:text-primary-600"
          >
            필터 초기화
          </button>
        )}
      </div>
    </aside>
  );
}
