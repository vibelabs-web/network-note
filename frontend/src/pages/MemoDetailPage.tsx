/**
 * MemoDetailPage - 메모 상세/편집 페이지
 */

import { useParams } from 'react-router-dom';

export function MemoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isNew ? '새 메모' : '메모 편집'}
        </h1>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            저장
          </button>
        </div>
      </div>

      {/* 메모 편집 폼 */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 shadow-card space-y-4">
        {/* 제목 */}
        <div>
          <input
            type="text"
            placeholder="메모 제목"
            className="w-full text-xl font-semibold bg-transparent border-none focus:outline-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>

        {/* 태그 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">태그:</span>
          <input
            type="text"
            placeholder="태그 추가 (쉼표로 구분)"
            className="flex-1 text-sm bg-transparent border-none focus:outline-none focus:ring-0 text-gray-700 dark:text-gray-300 placeholder-gray-400"
          />
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* 내용 */}
        <div>
          <textarea
            placeholder="메모 내용을 입력하세요... (@멘션으로 다른 메모와 연결할 수 있습니다)"
            rows={20}
            className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-gray-700 dark:text-gray-300 placeholder-gray-400 resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* 메모 정보 (기존 메모일 경우) */}
      {!isNew && (
        <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-xl p-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex gap-6">
            <span>Zettel ID: {id}</span>
            <span>연결: 0개</span>
            <span>생성일: -</span>
            <span>수정일: -</span>
          </div>
        </div>
      )}
    </div>
  );
}
