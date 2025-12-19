# Design System - 디자인 시스템

## Star Note - UI/UX 디자인 가이드

**버전:** 1.0
**작성일:** 2024-12-25
**목적:** 일관된 사용자 경험을 위한 디자인 시스템 정의

---

## 목차

1. [디자인 원칙](#1-디자인-원칙)
2. [컬러 시스템](#2-컬러-시스템)
3. [타이포그래피](#3-타이포그래피)
4. [간격 시스템](#4-간격-시스템)
5. [컴포넌트 라이브러리](#5-컴포넌트-라이브러리)
6. [아이콘 시스템](#6-아이콘-시스템)
7. [애니메이션](#7-애니메이션)
8. [반응형 디자인](#8-반응형-디자인)
9. [접근성](#9-접근성)

---

## 1. 디자인 원칙

### 1.1 핵심 가치

| 원칙 | 설명 |
|-----|------|
| **심플함 (Simple)** | 복잡한 기능도 직관적으로 사용할 수 있어야 함 |
| **연결 (Connected)** | 메모 간의 관계를 시각적으로 명확하게 표현 |
| **집중 (Focused)** | 글쓰기에 집중할 수 있는 방해 없는 환경 |
| **발견 (Discoverable)** | 숨겨진 연결과 인사이트를 자연스럽게 발견 |

### 1.2 디자인 메타포

**별(Star)** 메타포를 UI 전반에 적용합니다.

```
┌─────────────────────────────────────────────────────────────┐
│  💫 메모 = 별 (Star)                                        │
│                                                             │
│  • 연결 없는 메모 → 외로운 별 (희미함)                        │
│  • 연결 많은 메모 → 밝은 별 (중심 역할)                       │
│  • 연결선 → 별자리를 연결하는 선                             │
│  • 전체 네트워크 → 밤하늘의 별자리                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 컬러 시스템

### 2.1 라이트 모드

```css
:root {
  /* Primary Colors */
  --color-primary-50: #EEF2FF;
  --color-primary-100: #E0E7FF;
  --color-primary-200: #C7D2FE;
  --color-primary-300: #A5B4FC;
  --color-primary-400: #818CF8;
  --color-primary-500: #6366F1;   /* 메인 프라이머리 */
  --color-primary-600: #4F46E5;
  --color-primary-700: #4338CA;
  --color-primary-800: #3730A3;
  --color-primary-900: #312E81;

  /* Neutral Colors */
  --color-gray-50: #F9FAFB;
  --color-gray-100: #F3F4F6;
  --color-gray-200: #E5E7EB;
  --color-gray-300: #D1D5DB;
  --color-gray-400: #9CA3AF;
  --color-gray-500: #6B7280;
  --color-gray-600: #4B5563;
  --color-gray-700: #374151;
  --color-gray-800: #1F2937;
  --color-gray-900: #111827;

  /* Accent Colors */
  --color-success: #10B981;       /* 성공, 연결됨 */
  --color-warning: #F59E0B;       /* 경고, 제안 */
  --color-error: #EF4444;         /* 에러, 삭제 */
  --color-info: #3B82F6;          /* 정보 */

  /* Star Colors (그래프 노드) */
  --color-star-dim: #9CA3AF;      /* Level 0: 외로운 별 */
  --color-star-small: #6B7280;    /* Level 1: 작은 별 */
  --color-star-medium: #4F46E5;   /* Level 2: 중간 별 */
  --color-star-large: #6366F1;    /* Level 3: 큰 별 */
  --color-star-hub: #818CF8;      /* Level 4: 중심 별 */

  /* Background */
  --color-bg-primary: #FFFFFF;
  --color-bg-secondary: #F9FAFB;
  --color-bg-tertiary: #F3F4F6;

  /* Text */
  --color-text-primary: #111827;
  --color-text-secondary: #6B7280;
  --color-text-tertiary: #9CA3AF;
  --color-text-inverse: #FFFFFF;

  /* Border */
  --color-border-default: #E5E7EB;
  --color-border-focus: #6366F1;
}
```

### 2.2 다크 모드

```css
[data-theme="dark"] {
  /* Primary Colors */
  --color-primary-50: #1E1B4B;
  --color-primary-100: #312E81;
  --color-primary-200: #3730A3;
  --color-primary-300: #4338CA;
  --color-primary-400: #4F46E5;
  --color-primary-500: #6366F1;
  --color-primary-600: #818CF8;
  --color-primary-700: #A5B4FC;
  --color-primary-800: #C7D2FE;
  --color-primary-900: #E0E7FF;

  /* Neutral Colors */
  --color-gray-50: #111827;
  --color-gray-100: #1F2937;
  --color-gray-200: #374151;
  --color-gray-300: #4B5563;
  --color-gray-400: #6B7280;
  --color-gray-500: #9CA3AF;
  --color-gray-600: #D1D5DB;
  --color-gray-700: #E5E7EB;
  --color-gray-800: #F3F4F6;
  --color-gray-900: #F9FAFB;

  /* Star Colors (그래프 노드) - 더 밝게 */
  --color-star-dim: #4B5563;
  --color-star-small: #6B7280;
  --color-star-medium: #818CF8;
  --color-star-large: #A5B4FC;
  --color-star-hub: #C7D2FE;

  /* Background */
  --color-bg-primary: #0F172A;
  --color-bg-secondary: #1E293B;
  --color-bg-tertiary: #334155;

  /* Text */
  --color-text-primary: #F9FAFB;
  --color-text-secondary: #9CA3AF;
  --color-text-tertiary: #6B7280;
  --color-text-inverse: #111827;

  /* Border */
  --color-border-default: #374151;
  --color-border-focus: #818CF8;
}
```

### 2.3 컬러 사용 가이드

| 용도 | 라이트 모드 | 다크 모드 |
|-----|-----------|----------|
| 페이지 배경 | `--color-bg-primary` | `--color-bg-primary` |
| 카드 배경 | `--color-bg-secondary` | `--color-bg-secondary` |
| 사이드바 배경 | `--color-bg-tertiary` | `--color-bg-tertiary` |
| 본문 텍스트 | `--color-text-primary` | `--color-text-primary` |
| 보조 텍스트 | `--color-text-secondary` | `--color-text-secondary` |
| 버튼 (Primary) | `--color-primary-500` | `--color-primary-500` |
| 링크/멘션 | `--color-primary-600` | `--color-primary-400` |
| 연결선 (Explicit) | `--color-primary-500` | `--color-primary-400` |
| 연결선 (Suggested) | `--color-gray-400` | `--color-gray-500` |

---

## 3. 타이포그래피

### 3.1 폰트 패밀리

```css
:root {
  /* 본문용 폰트 */
  --font-sans: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI',
               Roboto, 'Helvetica Neue', Arial, sans-serif;

  /* 코드용 폰트 */
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Source Code Pro',
               Consolas, Monaco, monospace;
}
```

### 3.2 폰트 크기 스케일

```css
:root {
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */
  --text-4xl: 2.25rem;    /* 36px */
}
```

### 3.3 폰트 무게

```css
:root {
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

### 3.4 Line Height

```css
:root {
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;
}
```

### 3.5 타이포그래피 사용 가이드

| 요소 | 크기 | 무게 | Line Height | 용도 |
|-----|------|-----|------------|-----|
| H1 | `--text-3xl` | `--font-bold` | `--leading-tight` | 페이지 제목 |
| H2 | `--text-2xl` | `--font-semibold` | `--leading-tight` | 섹션 제목 |
| H3 | `--text-xl` | `--font-semibold` | `--leading-snug` | 카드 제목 |
| Body | `--text-base` | `--font-normal` | `--leading-relaxed` | 본문 |
| Body Small | `--text-sm` | `--font-normal` | `--leading-normal` | 보조 텍스트 |
| Caption | `--text-xs` | `--font-medium` | `--leading-normal` | 레이블, 태그 |
| Code | `--text-sm` | `--font-normal` | `--leading-relaxed` | 코드 블록 |

---

## 4. 간격 시스템

### 4.1 간격 스케일 (8px 기반)

```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
}
```

### 4.2 Border Radius

```css
:root {
  --radius-none: 0;
  --radius-sm: 0.25rem;    /* 4px */
  --radius-md: 0.375rem;   /* 6px */
  --radius-lg: 0.5rem;     /* 8px */
  --radius-xl: 0.75rem;    /* 12px */
  --radius-2xl: 1rem;      /* 16px */
  --radius-full: 9999px;   /* 원형 */
}
```

### 4.3 그림자 (Shadow)

```css
:root {
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
               0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
               0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
               0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* 다크 모드 */
[data-theme="dark"] {
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4),
               0 2px 4px -1px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4),
               0 4px 6px -2px rgba(0, 0, 0, 0.3);
}
```

---

## 5. 컴포넌트 라이브러리

### 5.1 버튼 (Button)

```
┌─────────────────────────────────────────────────────────────────────┐
│ 버튼 종류                                                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Primary    │  │  Secondary   │  │    Ghost     │              │
│  │   ████████   │  │   ░░░░░░░░   │  │              │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                      │
│  크기: sm (32px) | md (40px) | lg (48px)                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

```tsx
// Button 컴포넌트 스펙
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}
```

**스타일 가이드:**

| Variant | Background | Text | Border | 용도 |
|---------|-----------|------|--------|-----|
| Primary | `primary-500` | white | none | 주요 액션 (저장, 생성) |
| Secondary | `gray-100` | `gray-700` | `gray-300` | 보조 액션 |
| Ghost | transparent | `gray-600` | none | 최소한의 액션 |
| Danger | `error` | white | none | 삭제, 위험 액션 |

### 5.2 입력 필드 (Input)

```
┌─────────────────────────────────────────────────────────────────────┐
│ 입력 필드 상태                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Default:   ┌─────────────────────────────┐                        │
│             │ 텍스트를 입력하세요           │                        │
│             └─────────────────────────────┘                        │
│                                                                      │
│  Focus:     ┌─────────────────────────────┐                        │
│             │ 입력 중...                   │  ← 파란색 테두리        │
│             └─────────────────────────────┘                        │
│                                                                      │
│  Error:     ┌─────────────────────────────┐                        │
│             │ 잘못된 입력                  │  ← 빨간색 테두리        │
│             └─────────────────────────────┘                        │
│             ⚠ 에러 메시지                                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.3 카드 (Card)

```
┌─────────────────────────────────────────────────────────────────────┐
│ 메모 카드 레이아웃                                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │  제텔카스텐 노트 작성법                           ⭐ 5     │   │
│  │  2024-12-25-001                                            │   │
│  │                                                             │   │
│  │  제텔카스텐은 독일어로 "메모 상자"를 뜻하며,                │   │
│  │  개인 지식 관리 시스템으로 널리 알려져 있습니다...           │   │
│  │                                                             │   │
│  │  ┌────────┐ ┌────────┐ ┌──────┐                          │   │
│  │  │ #학습  │ │ #PKM   │ │ ...  │                          │   │
│  │  └────────┘ └────────┘ └──────┘                          │   │
│  │                                                             │   │
│  │  2시간 전 수정됨                                           │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  간격: padding 16px, gap 8px                                        │
│  테두리: 1px solid border-default, radius-lg                        │
│  호버: shadow-md, 테두리 색상 진하게                                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.4 태그 (Tag)

```
┌─────────────────────────────────────────────────────────────────────┐
│ 태그 스타일                                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐                      │
│  │ #javascript│  │  #react   │  │  #학습    │                      │
│  └───────────┘  └───────────┘  └───────────┘                      │
│                                                                      │
│  크기: text-xs, padding 2px 8px                                     │
│  색상: primary-100 배경, primary-700 텍스트                          │
│  테두리: radius-full                                                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.5 드롭다운/셀렉트

```
┌─────────────────────────────────────────────────────────────────────┐
│ 멘션 자동완성 드롭다운                                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  @ 입력 시:                                                          │
│                                                                      │
│  ┌─────────────────────────────────────┐                           │
│  │ 🔍 메모 검색...                      │  ← 검색 입력               │
│  ├─────────────────────────────────────┤                           │
│  │ ░░ 제텔카스텐 노트 작성법            │  ← 선택됨 (하이라이트)     │
│  │    2024-12-25-001                   │                           │
│  ├─────────────────────────────────────┤                           │
│  │    React 상태 관리                   │                           │
│  │    2024-12-24-003                   │                           │
│  ├─────────────────────────────────────┤                           │
│  │    JavaScript 기초                   │                           │
│  │    2024-12-23-001                   │                           │
│  └─────────────────────────────────────┘                           │
│                                                                      │
│  위치: 커서 바로 아래, 최대 높이 300px                               │
│  그림자: shadow-lg                                                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.6 제안 카드 (Suggestion Card)

```
┌─────────────────────────────────────────────────────────────────────┐
│ AI 연결 제안 카드                                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  🤖 AI 제안                                                  │   │
│  │                                                             │   │
│  │  React 상태 관리                                            │   │
│  │  2024-12-24-003                                            │   │
│  │                                                             │   │
│  │  유사도: ████████░░ 85%                                    │   │
│  │                                                             │   │
│  │  연결 이유: 둘 다 프론트엔드 상태 관리에 대해                 │   │
│  │  다루고 있습니다.                                           │   │
│  │                                                             │   │
│  │  ┌──────────────┐  ┌──────────────┐                       │   │
│  │  │  ✓ 연결하기  │  │   ✗ 거부    │                       │   │
│  │  └──────────────┘  └──────────────┘                       │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  배경: warning 계열 (연한 노란색)                                    │
│  승인 버튼: primary, 거부 버튼: ghost                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.7 그래프 노드 (Graph Node)

```
┌─────────────────────────────────────────────────────────────────────┐
│ 별 등급별 노드 디자인                                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Level 0 (연결 0개)     Level 1 (1-2개)      Level 2 (3-5개)        │
│       ○                     ●                    ●                  │
│     5px                   8px                  12px                  │
│   opacity 0.3          opacity 0.5          opacity 0.7             │
│   #9CA3AF              #6B7280              #4F46E5                 │
│                                                                      │
│  Level 3 (6-10개)      Level 4 (10개+)                              │
│       ●                     ●                                        │
│     18px                  25px                                       │
│   opacity 0.9          opacity 1.0                                  │
│   #6366F1              #818CF8                                      │
│   glow effect          pulse animation                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. 아이콘 시스템

### 6.1 아이콘 라이브러리

**Lucide React** 사용 권장 (경량, 일관된 스타일)

```bash
pnpm add lucide-react
```

### 6.2 주요 아이콘 매핑

| 기능 | 아이콘 | Lucide 이름 |
|-----|-------|------------|
| 새 메모 | ➕ | `Plus` |
| 저장 | 💾 | `Save` |
| 삭제 | 🗑️ | `Trash2` |
| 편집 | ✏️ | `Pencil` |
| 검색 | 🔍 | `Search` |
| 설정 | ⚙️ | `Settings` |
| 그래프 | 📊 | `Network` |
| 목록 | 📝 | `List` |
| 태그 | 🏷️ | `Tag` |
| 연결 | 🔗 | `Link2` |
| 멘션 | @ | `AtSign` |
| 별 (연결됨) | ⭐ | `Star` |
| 확대 | 🔎+ | `ZoomIn` |
| 축소 | 🔎- | `ZoomOut` |
| 다크 모드 | 🌙 | `Moon` |
| 라이트 모드 | ☀️ | `Sun` |

### 6.3 아이콘 크기

```css
:root {
  --icon-xs: 12px;
  --icon-sm: 16px;
  --icon-md: 20px;
  --icon-lg: 24px;
  --icon-xl: 32px;
}
```

---

## 7. 애니메이션

### 7.1 Transition 기본값

```css
:root {
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
  --transition-slow: 300ms ease;
  --transition-slower: 500ms ease;
}
```

### 7.2 애니메이션 종류

```css
/* 페이드 인 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 슬라이드 업 */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 스케일 인 */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 펄스 (중심 별) */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

/* 글로우 (노드 호버) */
@keyframes glow {
  0%, 100% {
    filter: drop-shadow(0 0 4px var(--color-primary-400));
  }
  50% {
    filter: drop-shadow(0 0 8px var(--color-primary-400));
  }
}
```

### 7.3 사용 가이드

| 상황 | 애니메이션 | Duration |
|-----|----------|----------|
| 버튼 호버 | scale 1.02 | 150ms |
| 카드 호버 | shadow 증가 | 200ms |
| 모달 열기 | fadeIn + scaleIn | 200ms |
| 드롭다운 열기 | slideUp | 150ms |
| 페이지 전환 | fadeIn | 300ms |
| 그래프 노드 이동 | position | 500ms |
| 중심 별 | pulse | 2000ms (반복) |

---

## 8. 반응형 디자인

### 8.1 브레이크포인트

```css
:root {
  --breakpoint-sm: 640px;   /* 모바일 */
  --breakpoint-md: 768px;   /* 태블릿 세로 */
  --breakpoint-lg: 1024px;  /* 태블릿 가로 / 작은 데스크톱 */
  --breakpoint-xl: 1280px;  /* 데스크톱 */
  --breakpoint-2xl: 1536px; /* 큰 데스크톱 */
}
```

### 8.2 레이아웃 변화

```
Desktop (≥1024px)
┌─────────────────────────────────────────────────────────────────────┐
│ ┌──────────┐ ┌─────────────────────────────────────────────────┐   │
│ │          │ │                                                 │   │
│ │ Sidebar  │ │                Main Content                     │   │
│ │  280px   │ │                                                 │   │
│ │          │ │                                                 │   │
│ │          │ │                                                 │   │
│ └──────────┘ └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

Tablet (768px - 1023px)
┌─────────────────────────────────────────────────────────────────────┐
│ ┌────────┐ ┌─────────────────────────────────────────────────────┐ │
│ │ Icons  │ │                                                     │ │
│ │  64px  │ │                  Main Content                       │ │
│ │        │ │                                                     │ │
│ └────────┘ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘

Mobile (<768px)
┌───────────────────────────────────────┐
│ ┌─────────────────────────────────┐   │
│ │          Top Bar                │   │  ← 햄버거 메뉴
│ └─────────────────────────────────┘   │
│ ┌─────────────────────────────────┐   │
│ │                                 │   │
│ │         Main Content            │   │
│ │          (Full Width)           │   │
│ │                                 │   │
│ └─────────────────────────────────┘   │
│ ┌─────────────────────────────────┐   │
│ │       Bottom Navigation         │   │  ← 모바일 네비게이션
│ └─────────────────────────────────┘   │
└───────────────────────────────────────┘
```

### 8.3 반응형 유틸리티

```css
/* Tailwind CSS 클래스 사용 */
.sidebar {
  @apply hidden lg:block lg:w-[280px];
}

.main-content {
  @apply w-full lg:ml-[280px];
}

.mobile-nav {
  @apply fixed bottom-0 left-0 right-0 lg:hidden;
}
```

---

## 9. 접근성

### 9.1 색상 대비

모든 텍스트는 WCAG AA 기준 충족:
- 일반 텍스트: 4.5:1 이상
- 큰 텍스트 (18px+): 3:1 이상

### 9.2 키보드 네비게이션

| 단축키 | 기능 |
|-------|------|
| `Tab` | 다음 요소로 이동 |
| `Shift + Tab` | 이전 요소로 이동 |
| `Enter` | 버튼/링크 활성화 |
| `Escape` | 모달/드롭다운 닫기 |
| `Arrow Keys` | 드롭다운 내 이동 |
| `Cmd/Ctrl + N` | 새 메모 |
| `Cmd/Ctrl + S` | 저장 |
| `Cmd/Ctrl + K` | 검색 |
| `Cmd/Ctrl + G` | 그래프 뷰 |

### 9.3 Focus 상태

```css
/* 모든 인터랙티브 요소에 명확한 포커스 표시 */
:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

/* 마우스 클릭 시 포커스 링 숨김 */
:focus:not(:focus-visible) {
  outline: none;
}
```

### 9.4 스크린 리더 지원

```tsx
// 아이콘 버튼에 aria-label 필수
<button aria-label="새 메모 작성">
  <PlusIcon />
</button>

// 상태 변경 알림
<div role="status" aria-live="polite">
  메모가 저장되었습니다.
</div>

// 그래프 노드
<circle
  role="button"
  aria-label={`${title}, ${connectionCount}개의 연결`}
  tabIndex={0}
/>
```

---

## 부록

### A. Tailwind CSS 설정

```javascript
// tailwind.config.js
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          // ... 전체 색상 팔레트
          900: '#312E81',
        },
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
    },
  },
}
```

### B. CSS 변수 전체 목록

```css
/* 모든 CSS 변수는 :root와 [data-theme="dark"]에 정의 */
/* 상세 내용은 2. 컬러 시스템 섹션 참조 */
```

### C. 컴포넌트 체크리스트

| 컴포넌트 | 라이트 모드 | 다크 모드 | 접근성 | 반응형 |
|---------|-----------|----------|--------|-------|
| Button | ✅ | ✅ | ✅ | ✅ |
| Input | ✅ | ✅ | ✅ | ✅ |
| Card | ✅ | ✅ | ✅ | ✅ |
| Tag | ✅ | ✅ | ✅ | ✅ |
| Dropdown | ✅ | ✅ | ✅ | ✅ |
| Modal | ✅ | ✅ | ✅ | ✅ |
| GraphNode | ✅ | ✅ | ✅ | N/A |
| Sidebar | ✅ | ✅ | ✅ | ✅ |

---

**문서 관리**
- 새로운 컴포넌트 추가 시 이 문서를 업데이트합니다.
- 디자인 토큰 변경 시 모든 관련 섹션을 수정합니다.
