# Frontend Development Skill

React + TypeScript 프론트엔드 개발을 위한 스킬입니다.

## 사용 시점
- React 컴포넌트 작성 시
- D3.js 그래프 시각화 작업 시
- Zustand 스토어 설계 시
- Tailwind CSS 스타일링 시

## 기술 스택
- React 18 + TypeScript
- Vite (빌드)
- D3.js (그래프)
- Tailwind CSS (스타일)
- Zustand (상태 관리)
- Axios (HTTP)
- react-markdown (마크다운 렌더링)

## 디렉토리 구조
```
frontend/
├── src/
│   ├── api/              # API 클라이언트
│   │   ├── client.ts
│   │   ├── memos.ts
│   │   ├── connections.ts
│   │   └── suggestions.ts
│   ├── components/       # React 컴포넌트
│   │   ├── Layout/
│   │   ├── MemoCard/
│   │   ├── MemoEditor/
│   │   ├── GraphView/
│   │   ├── MentionAutocomplete/
│   │   └── SuggestionCard/
│   ├── pages/            # 페이지 컴포넌트
│   │   ├── MemosPage.tsx
│   │   ├── MemoDetailPage.tsx
│   │   └── GraphPage.tsx
│   ├── stores/           # Zustand 스토어
│   │   └── memoStore.ts
│   ├── hooks/            # 커스텀 훅
│   ├── types/            # TypeScript 타입
│   │   └── memo.ts
│   ├── utils/            # 유틸리티
│   │   └── mentionParser.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── Dockerfile
├── Dockerfile.prod
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 코딩 컨벤션
- 함수형 컴포넌트만 사용
- 컴포넌트 파일은 PascalCase
- 훅은 `use` 접두사
- 타입은 `types/` 디렉토리에 정의
- Tailwind 유틸리티 클래스 우선 사용

## 주요 패턴

### API 클라이언트
```typescript
import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export const getMemos = async (params?: MemoQueryParams) => {
  const { data } = await client.get<MemoListResponse>('/api/memos', { params });
  return data;
};
```

### Zustand 스토어
```typescript
import { create } from 'zustand';

interface MemoStore {
  memos: Memo[];
  loading: boolean;
  fetchMemos: () => Promise<void>;
}

export const useMemoStore = create<MemoStore>((set) => ({
  memos: [],
  loading: false,
  fetchMemos: async () => {
    set({ loading: true });
    const data = await getMemos();
    set({ memos: data.items, loading: false });
  },
}));
```

### React 컴포넌트
```typescript
import { FC } from 'react';

interface MemoCardProps {
  memo: Memo;
  onClick?: () => void;
}

export const MemoCard: FC<MemoCardProps> = ({ memo, onClick }) => {
  return (
    <div
      className="p-4 rounded-lg border hover:shadow-md cursor-pointer"
      onClick={onClick}
    >
      <h3 className="font-bold text-lg">{memo.title}</h3>
      <p className="text-gray-600 text-sm">{memo.zettelId}</p>
    </div>
  );
};
```

### D3.js 그래프
```typescript
import * as d3 from 'd3';
import { useEffect, useRef } from 'react';

export const GraphView: FC<{ nodes: Node[]; edges: Edge[] }> = ({ nodes, edges }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges).id(d => d.id))
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2));
    // ...
  }, [nodes, edges]);

  return <svg ref={svgRef} className="w-full h-full" />;
};
```

## 실행 명령어
```bash
# 개발 서버 (Docker)
docker compose up frontend

# 로그 확인
docker compose logs -f frontend

# 컨테이너 접속
docker compose exec frontend sh

# 패키지 설치 (로컬)
pnpm install
pnpm dev
```
