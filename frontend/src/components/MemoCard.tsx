/**
 * MemoCard 컴포넌트
 * 메모 목록에서 각 메모를 카드 형태로 표시
 */

import { Link } from 'react-router-dom';
import type { Memo } from '@/types';
import { Tag } from './common';

interface MemoCardProps {
  memo: Memo;
}

// 날짜 포맷팅 헬퍼
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// 콘텐츠 미리보기 추출 (마크다운 제거, 최대 3줄)
function getPreview(content: string, maxLength: number = 150): string {
  // 기본 마크다운 문법 제거
  const plainText = content
    .replace(/#{1,6}\s+/g, '') // 헤딩
    .replace(/\*\*(.+?)\*\*/g, '$1') // 볼드
    .replace(/\*(.+?)\*/g, '$1') // 이탤릭
    .replace(/`(.+?)`/g, '$1') // 인라인 코드
    .replace(/```[\s\S]*?```/g, '') // 코드 블록
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // 링크
    .replace(/!\[.+?\]\(.+?\)/g, '') // 이미지
    .replace(/@[\w가-힣]+/g, (match) => match) // 멘션은 유지
    .replace(/\n+/g, ' ') // 줄바꿈을 공백으로
    .trim();

  if (plainText.length <= maxLength) return plainText;
  return plainText.substring(0, maxLength).trim() + '...';
}

export function MemoCard({ memo }: MemoCardProps) {
  return (
    <Link
      to={`/memos/${memo.id}`}
      className="block bg-white dark:bg-dark-bg-secondary rounded-xl p-5 shadow-card hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
    >
      {/* 헤더: 제목과 연결 수 */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
          {memo.title}
        </h3>
        {memo.connection_count > 0 && (
          <div className="flex items-center gap-1 text-amber-500 flex-shrink-0">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="text-sm font-medium">{memo.connection_count}</span>
          </div>
        )}
      </div>

      {/* Zettel ID */}
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 font-mono">
        {memo.zettel_id}
      </p>

      {/* 내용 미리보기 */}
      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">
        {getPreview(memo.content)}
      </p>

      {/* 태그 */}
      {memo.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {memo.tags.slice(0, 5).map((tag) => (
            <Tag key={tag} label={tag} size="sm" />
          ))}
          {memo.tags.length > 5 && (
            <span className="text-xs text-gray-400 dark:text-gray-500 self-center">
              +{memo.tags.length - 5}
            </span>
          )}
        </div>
      )}

      {/* 푸터: 날짜 정보 */}
      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
        <span>생성: {formatDate(memo.created_at)}</span>
        {memo.created_at !== memo.updated_at && (
          <span>수정: {formatDate(memo.updated_at)}</span>
        )}
      </div>
    </Link>
  );
}
