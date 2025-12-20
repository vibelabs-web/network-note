/**
 * MentionAutocomplete - 멘션 자동완성 드롭다운 컴포넌트
 * @ 입력 시 다른 메모를 검색하고 선택할 수 있는 드롭다운
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { searchMemoNames } from '@/api/memos';
import type { MemoNameSearchResult } from '@/types';

interface MentionAutocompleteProps {
  // 검색어 (@ 이후 텍스트)
  query: string;
  // 드롭다운 표시 위치
  position: { top: number; left: number };
  // 멘션 선택 시 콜백
  onSelect: (memo: MemoNameSearchResult) => void;
  // 닫기 콜백
  onClose: () => void;
  // 현재 메모 ID (검색 결과에서 제외)
  excludeId?: string;
}

export function MentionAutocomplete({
  query,
  position,
  onSelect,
  onClose,
  excludeId,
}: MentionAutocompleteProps) {
  const [results, setResults] = useState<MemoNameSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // 검색 실행
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await searchMemoNames(searchQuery, 10);
        // 현재 메모 제외
        const filtered = excludeId
          ? response.results.filter((m) => m.id !== excludeId)
          : response.results;
        setResults(filtered);
        setSelectedIndex(0);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [excludeId]
  );

  // 검색어 변경 시 디바운싱 적용
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, performSearch]);

  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            onSelect(results[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'Tab':
          e.preventDefault();
          if (results[selectedIndex]) {
            onSelect(results[selectedIndex]);
          } else {
            onClose();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [results, selectedIndex, onSelect, onClose]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // 선택된 항목이 보이도록 스크롤
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const selectedItem = container.querySelector(
      `[data-index="${selectedIndex}"]`
    );
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  return (
    <div
      ref={containerRef}
      className="fixed z-50 bg-[#252526] border border-[#3c3c3c] rounded-lg shadow-xl overflow-hidden min-w-[250px] max-w-[350px]"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {/* 검색 상태 표시 */}
      {isLoading && (
        <div className="px-3 py-2 text-xs text-gray-500 flex items-center gap-2">
          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          검색 중...
        </div>
      )}

      {/* 결과 목록 */}
      {!isLoading && results.length > 0 && (
        <ul className="max-h-[200px] overflow-y-auto">
          {results.map((memo, index) => (
            <li
              key={memo.id}
              data-index={index}
              onClick={() => onSelect(memo)}
              className={`px-3 py-2 cursor-pointer flex items-center gap-2 transition-colors ${
                index === selectedIndex
                  ? 'bg-[#094771] text-white'
                  : 'hover:bg-[#3c3c3c] text-gray-300'
              }`}
            >
              {/* 메모 아이콘 */}
              <svg
                className="w-4 h-4 flex-shrink-0 opacity-60"
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
                <div className="text-sm truncate">{memo.title}</div>
                {/* Zettel ID */}
                <div
                  className={`text-xs ${
                    index === selectedIndex
                      ? 'text-blue-200'
                      : 'text-gray-500'
                  }`}
                >
                  {memo.zettel_id}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 결과 없음 */}
      {!isLoading && results.length === 0 && query.trim() && (
        <div className="px-3 py-3 text-sm text-gray-500 text-center">
          "{query}"와 일치하는 메모가 없습니다
        </div>
      )}

      {/* 빈 검색어 */}
      {!isLoading && !query.trim() && (
        <div className="px-3 py-3 text-sm text-gray-500 text-center">
          메모 이름을 입력하세요
        </div>
      )}

      {/* 단축키 안내 */}
      <div className="px-3 py-1.5 bg-[#1e1e1e] border-t border-[#3c3c3c] flex items-center gap-3 text-xs text-gray-500">
        <span>
          <kbd className="px-1 py-0.5 bg-[#3c3c3c] rounded text-gray-400">
            ↑↓
          </kbd>{' '}
          이동
        </span>
        <span>
          <kbd className="px-1 py-0.5 bg-[#3c3c3c] rounded text-gray-400">
            Enter
          </kbd>{' '}
          선택
        </span>
        <span>
          <kbd className="px-1 py-0.5 bg-[#3c3c3c] rounded text-gray-400">
            Esc
          </kbd>{' '}
          닫기
        </span>
      </div>
    </div>
  );
}
