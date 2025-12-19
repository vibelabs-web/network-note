/**
 * WelcomePage - 메모가 선택되지 않았을 때 표시되는 환영 화면
 * Scrivener 스타일의 깔끔한 빈 상태
 */

import { useNavigate } from 'react-router-dom';

export function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8">
      <div className="text-center max-w-md">
        {/* 로고/아이콘 */}
        <div className="mb-6">
          <svg className="w-16 h-16 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </div>

        <h1 className="text-xl font-medium text-gray-300 mb-2">
          Star Note
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          네트워크 그래프 기반 지식관리 노트
        </p>

        {/* 퀵 액션 */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/memos/new')}
            className="w-full px-4 py-3 bg-[#0e639c] hover:bg-[#1177bb] text-white text-sm rounded transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            새 메모 작성
          </button>

          <button
            onClick={() => navigate('/graph')}
            className="w-full px-4 py-3 bg-[#3c3c3c] hover:bg-[#4c4c4c] text-gray-300 text-sm rounded transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            그래프 보기
          </button>
        </div>

        {/* 단축키 힌트 */}
        <div className="mt-12 text-xs text-gray-600">
          <div className="flex items-center justify-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[#3c3c3c] rounded text-gray-400">Cmd</kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 bg-[#3c3c3c] rounded text-gray-400">S</kbd>
              <span className="ml-1">저장</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
