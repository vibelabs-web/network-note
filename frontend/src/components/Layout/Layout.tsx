/**
 * Layout - Scrivener 스타일 3-패널 레이아웃
 * 바인더(좌측) + 에디터(중앙) 구조
 */

import { useState, useEffect } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { Binder } from './Binder';
import { useMemoStore } from '@/stores/memoStore';

export function Layout() {
  const [binderWidth, setBinderWidth] = useState(280);
  const [isBinderCollapsed, setIsBinderCollapsed] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const { memos, fetchMemos } = useMemoStore();

  // 초기 메모 로드
  useEffect(() => {
    fetchMemos({ limit: 100 });
  }, [fetchMemos]);

  // 메모 선택 핸들러
  const handleSelectMemo = (memoId: string) => {
    navigate(`/memos/${memoId}`);
  };

  // 새 메모 생성
  const handleNewMemo = () => {
    navigate('/memos/new');
  };

  return (
    <div className="h-screen flex bg-[#1e1e1e] text-gray-200 overflow-hidden">
      {/* 바인더 (좌측 패널) */}
      <Binder
        width={isBinderCollapsed ? 0 : binderWidth}
        memos={memos}
        selectedId={id}
        onSelectMemo={handleSelectMemo}
        onNewMemo={handleNewMemo}
        onCollapse={() => setIsBinderCollapsed(!isBinderCollapsed)}
        isCollapsed={isBinderCollapsed}
      />

      {/* 리사이즈 핸들 */}
      {!isBinderCollapsed && (
        <div
          className="w-1 bg-[#2d2d2d] hover:bg-[#007acc] cursor-col-resize flex-shrink-0 transition-colors"
          onMouseDown={(e) => {
            e.preventDefault();
            const startX = e.clientX;
            const startWidth = binderWidth;

            const onMouseMove = (e: MouseEvent) => {
              const newWidth = Math.max(200, Math.min(500, startWidth + e.clientX - startX));
              setBinderWidth(newWidth);
            };

            const onMouseUp = () => {
              document.removeEventListener('mousemove', onMouseMove);
              document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
          }}
        />
      )}

      {/* 메인 에디터 영역 */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
        {/* 미니멀 툴바 */}
        <div className="h-10 flex items-center px-4 bg-[#252526] border-b border-[#3c3c3c] flex-shrink-0">
          {/* 바인더 토글 */}
          <button
            onClick={() => setIsBinderCollapsed(!isBinderCollapsed)}
            className="p-1.5 rounded hover:bg-[#3c3c3c] transition-colors mr-3"
            title={isBinderCollapsed ? '바인더 열기' : '바인더 닫기'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>

          {/* 로고 */}
          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-sm">Star Note</span>
          </div>

          {/* 우측 액션 */}
          <div className="ml-auto flex items-center gap-2">
            {/* 그래프 버튼 */}
            <button
              onClick={() => navigate('/graph')}
              className="p-1.5 rounded hover:bg-[#3c3c3c] transition-colors text-gray-400 hover:text-gray-200"
              title="네트워크 그래프"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" strokeWidth={1.5} />
                <circle cx="19" cy="5" r="2" strokeWidth={1.5} />
                <circle cx="5" cy="5" r="2" strokeWidth={1.5} />
                <circle cx="5" cy="19" r="2" strokeWidth={1.5} />
                <circle cx="19" cy="19" r="2" strokeWidth={1.5} />
                <path strokeLinecap="round" strokeWidth={1.5} d="M12 9V7M12 15v2M9 12H7m8 0h2M14.5 9.5l2-2M9.5 14.5l-2 2M14.5 14.5l2 2M9.5 9.5l-2-2" />
              </svg>
            </button>

            {/* 새 메모 버튼 */}
            <button
              onClick={handleNewMemo}
              className="px-3 py-1 text-xs bg-[#0e639c] hover:bg-[#1177bb] rounded transition-colors"
            >
              + 새 메모
            </button>
          </div>
        </div>

        {/* 에디터 콘텐츠 */}
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
