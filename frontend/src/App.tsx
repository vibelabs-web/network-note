/**
 * Star Note - Main App Component
 * React Router를 사용한 라우팅 설정
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import {
  HomePage,
  MemoListPage,
  MemoDetailPage,
  GraphPage,
  NotFoundPage,
} from '@/pages';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Layout을 사용하는 라우트들 */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="memos" element={<MemoListPage />} />
          <Route path="memos/:id" element={<MemoDetailPage />} />
          <Route path="graph" element={<GraphPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
