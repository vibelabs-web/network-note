/**
 * Star Note - Main App Component
 * Scrivener 스타일 라우팅 설정
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import {
  WelcomePage,
  MemoDetailPage,
  GraphPage,
  NotFoundPage,
} from '@/pages';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Scrivener 스타일 레이아웃 */}
        <Route path="/" element={<Layout />}>
          {/* 기본: 환영 화면 */}
          <Route index element={<WelcomePage />} />
          {/* 메모 편집/생성 */}
          <Route path="memos/:id" element={<MemoDetailPage />} />
          {/* 그래프 뷰 */}
          <Route path="graph" element={<GraphPage />} />
          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
