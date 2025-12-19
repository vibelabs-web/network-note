/**
 * Layout 컴포넌트
 * 앱의 기본 레이아웃 (Header + Sidebar + Main Content)
 */

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-bg-primary dark:bg-dark-bg-primary">
      <Header onToggleSidebar={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} />

      {/* 메인 콘텐츠 영역 */}
      <main
        className={`
          pt-14 min-h-screen transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'pl-60' : 'pl-0'}
        `}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
