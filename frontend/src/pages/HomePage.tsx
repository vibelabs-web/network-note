/**
 * HomePage - 홈 페이지
 * 앱 대시보드 역할
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMemoStore } from '@/stores/memoStore';
import { MemoCard, Loading } from '@/components';

export function HomePage() {
  const { memos, total, isLoading, fetchMemos } = useMemoStore();

  // 최근 메모 로딩
  useEffect(() => {
    fetchMemos({ limit: 6 });
  }, [fetchMemos]);

  return (
    <div className="space-y-6">
      {/* 환영 메시지 */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 shadow-card">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Star Note에 오신 것을 환영합니다
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          네트워크 그래프 기반 지식관리 노트 앱입니다. 메모를 작성하고 연결하여 지식의 별자리를 만들어보세요.
        </p>
      </div>

      {/* 퀵 액션 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickActionCard
          title="새 메모 작성"
          description="새로운 아이디어를 기록하세요"
          icon="✍️"
          to="/memos/new"
        />
        <QuickActionCard
          title="메모 탐색"
          description="작성한 메모를 검색하고 탐색하세요"
          icon="📋"
          to="/memos"
        />
        <QuickActionCard
          title="그래프 보기"
          description="메모 간의 연결을 시각화하세요"
          icon="🔗"
          to="/graph"
        />
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="전체 메모" value={total.toString()} />
        <StatCard
          label="연결된 메모"
          value={memos.filter((m) => m.connection_count > 0).length.toString()}
        />
        <StatCard
          label="오늘 작성"
          value={
            memos.filter((m) => {
              const today = new Date().toDateString();
              return new Date(m.created_at).toDateString() === today;
            }).length.toString()
          }
        />
        <StatCard
          label="태그"
          value={[...new Set(memos.flatMap((m) => m.tags))].length.toString()}
        />
      </div>

      {/* 최근 메모 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            최근 메모
          </h2>
          <Link
            to="/memos"
            className="text-sm text-primary-500 hover:text-primary-600"
          >
            전체 보기 →
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loading size="md" text="메모를 불러오는 중..." />
          </div>
        ) : memos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {memos.slice(0, 6).map((memo) => (
              <MemoCard key={memo.id} memo={memo} />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-8 text-center shadow-card">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              아직 메모가 없습니다
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              첫 번째 메모를 작성해보세요.
            </p>
            <Link
              to="/memos/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>새 메모 작성</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: string;
  to: string;
}

function QuickActionCard({ title, description, icon, to }: QuickActionCardProps) {
  return (
    <Link
      to={to}
      className="block bg-white dark:bg-dark-bg-secondary rounded-xl p-5 shadow-card hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </Link>
  );
}

interface StatCardProps {
  label: string;
  value: string;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-4 shadow-card">
      <div className="text-2xl font-bold text-primary-500">{value}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
    </div>
  );
}
