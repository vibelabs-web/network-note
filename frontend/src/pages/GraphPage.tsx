/**
 * GraphPage - 그래프 뷰 페이지
 * D3.js로 메모 네트워크를 시각화
 */

export function GraphPage() {
  return (
    <div className="h-[calc(100vh-8rem)]">
      {/* 그래프 컨트롤 */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          그래프 뷰
        </h1>
        <div className="flex gap-2">
          <button
            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            확대
          </button>
          <button
            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            축소
          </button>
          <button
            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            초기화
          </button>
        </div>
      </div>

      {/* 그래프 캔버스 영역 */}
      <div className="w-full h-full bg-gray-900 dark:bg-dark-bg-secondary rounded-xl overflow-hidden relative">
        {/* 빈 상태 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">✨</div>
            <h3 className="text-lg font-semibold text-white mb-2">
              아직 표시할 별이 없습니다
            </h3>
            <p className="text-gray-400 mb-4">
              메모를 작성하면 이곳에 별로 표시됩니다.
            </p>
            <a
              href="/memos/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            >
              첫 번째 별 만들기
            </a>
          </div>
        </div>

        {/* D3.js 그래프가 렌더링될 SVG (추후 구현) */}
        {/* <svg id="graph-canvas" className="w-full h-full" /> */}
      </div>

      {/* 범례 */}
      <div className="mt-4 flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-star-dim" />
          <span>외로운 별 (0 연결)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-star-medium" />
          <span>중간 별 (3-5 연결)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-star-hub" />
          <span>중심 별 (10+ 연결)</span>
        </div>
      </div>
    </div>
  );
}
