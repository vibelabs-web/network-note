/**
 * HomePage - 홈 페이지
 * 앱 대시보드 역할
 */

export function HomePage() {
  return (
    <div className="space-y-6">
      {/* 환영 메시지 */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 shadow-card">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          ⭐ Star Note에 오신 것을 환영합니다
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
          href="/memos/new"
        />
        <QuickActionCard
          title="메모 탐색"
          description="작성한 메모를 검색하고 탐색하세요"
          icon="📋"
          href="/memos"
        />
        <QuickActionCard
          title="그래프 보기"
          description="메모 간의 연결을 시각화하세요"
          icon="🔗"
          href="/graph"
        />
      </div>

      {/* 통계 (placeholder) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="전체 메모" value="0" />
        <StatCard label="연결된 메모" value="0" />
        <StatCard label="오늘 작성" value="0" />
        <StatCard label="태그" value="0" />
      </div>
    </div>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
}

function QuickActionCard({ title, description, icon, href }: QuickActionCardProps) {
  return (
    <a
      href={href}
      className="block bg-white dark:bg-dark-bg-secondary rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow"
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </a>
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
