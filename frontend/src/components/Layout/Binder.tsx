/**
 * Binder - Scrivener 스타일 좌측 바인더
 * 메모 목록을 트리/리스트 형태로 표시
 */

import { useState, useMemo } from 'react';
import type { Memo } from '@/types';

interface BinderProps {
  width: number;
  memos: Memo[];
  selectedId?: string;
  onSelectMemo: (id: string) => void;
  onNewMemo: () => void;
  onCollapse: () => void;
  isCollapsed: boolean;
}

// 날짜 포맷팅
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
}

export function Binder({
  width,
  memos,
  selectedId,
  onSelectMemo,
  onNewMemo,
  isCollapsed,
}: BinderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['recent', 'all'])
  );

  // 검색 필터링
  const filteredMemos = useMemo(() => {
    if (!searchQuery.trim()) return memos;
    const query = searchQuery.toLowerCase();
    return memos.filter(
      (memo) =>
        memo.title.toLowerCase().includes(query) ||
        memo.content.toLowerCase().includes(query) ||
        memo.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [memos, searchQuery]);

  // 태그별 그룹핑
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    memos.forEach((memo) => memo.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [memos]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  if (isCollapsed) {
    return null;
  }

  return (
    <aside
      className="flex flex-col bg-[#252526] border-r border-[#3c3c3c] flex-shrink-0 overflow-hidden"
      style={{ width }}
    >
      {/* 헤더 */}
      <div className="h-10 flex items-center px-3 border-b border-[#3c3c3c] flex-shrink-0">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          바인더
        </span>
      </div>

      {/* 검색 */}
      <div className="p-2 border-b border-[#3c3c3c]">
        <div className="relative">
          <svg
            className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-2 py-1 text-xs bg-[#3c3c3c] border border-[#3c3c3c] rounded focus:border-[#007acc] focus:outline-none text-gray-200 placeholder-gray-500"
          />
        </div>
      </div>

      {/* 메모 목록 */}
      <div className="flex-1 overflow-y-auto">
        {/* 전체 메모 섹션 */}
        <Section
          title="전체 메모"
          count={filteredMemos.length}
          isExpanded={expandedSections.has('all')}
          onToggle={() => toggleSection('all')}
        >
          {filteredMemos.length === 0 ? (
            <div className="px-3 py-4 text-xs text-gray-500 text-center">
              메모가 없습니다
            </div>
          ) : (
            filteredMemos.map((memo) => (
              <MemoItem
                key={memo.id}
                memo={memo}
                isSelected={memo.id === selectedId}
                onClick={() => onSelectMemo(memo.id)}
              />
            ))
          )}
        </Section>

        {/* 태그 섹션 */}
        {allTags.length > 0 && (
          <Section
            title="태그"
            count={allTags.length}
            isExpanded={expandedSections.has('tags')}
            onToggle={() => toggleSection('tags')}
          >
            <div className="px-2 py-1 flex flex-wrap gap-1">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(`#${tag}`)}
                  className="px-2 py-0.5 text-xs bg-[#3c3c3c] hover:bg-[#4c4c4c] rounded transition-colors text-gray-300"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* 하단 새 메모 버튼 */}
      <div className="p-2 border-t border-[#3c3c3c]">
        <button
          onClick={onNewMemo}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs bg-[#0e639c] hover:bg-[#1177bb] rounded transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          새 메모
        </button>
      </div>
    </aside>
  );
}

// 섹션 컴포넌트
interface SectionProps {
  title: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Section({ title, count, isExpanded, onToggle, children }: SectionProps) {
  return (
    <div className="border-b border-[#3c3c3c]">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-400 hover:bg-[#2a2d2e] transition-colors"
      >
        <svg
          className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="uppercase tracking-wider">{title}</span>
        <span className="ml-auto text-gray-500">{count}</span>
      </button>
      {isExpanded && <div className="pb-1">{children}</div>}
    </div>
  );
}

// 메모 아이템 컴포넌트
interface MemoItemProps {
  memo: Memo;
  isSelected: boolean;
  onClick: () => void;
}

function MemoItem({ memo, isSelected, onClick }: MemoItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 transition-colors ${
        isSelected
          ? 'bg-[#094771] text-white'
          : 'hover:bg-[#2a2d2e] text-gray-300'
      }`}
    >
      <div className="flex items-start gap-2">
        {/* 문서 아이콘 */}
        <svg
          className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
            isSelected ? 'text-white' : 'text-gray-500'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>

        <div className="flex-1 min-w-0">
          {/* 제목 */}
          <div className="text-sm font-medium truncate">
            {memo.title || '제목 없음'}
          </div>

          {/* 미리보기 + 날짜 */}
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`text-xs truncate flex-1 ${
                isSelected ? 'text-gray-300' : 'text-gray-500'
              }`}
            >
              {memo.content.slice(0, 50).replace(/\n/g, ' ') || '내용 없음'}
            </span>
            <span
              className={`text-xs flex-shrink-0 ${
                isSelected ? 'text-gray-300' : 'text-gray-500'
              }`}
            >
              {formatDate(memo.updated_at)}
            </span>
          </div>

          {/* 태그 */}
          {memo.tags.length > 0 && (
            <div className="flex gap-1 mt-1">
              {memo.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className={`text-xs px-1 rounded ${
                    isSelected
                      ? 'bg-[#0e639c] text-gray-200'
                      : 'bg-[#3c3c3c] text-gray-400'
                  }`}
                >
                  #{tag}
                </span>
              ))}
              {memo.tags.length > 2 && (
                <span className={`text-xs ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                  +{memo.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
