/**
 * Star Note - 타입 정의
 */

// 메모 연결 타입
export type ConnectionType = 'explicit' | 'suggested';

// 메모 연결
export interface Connection {
  targetId: string;
  type: ConnectionType;
  strength: number;
  createdAt: string;
}

// 메모
export interface Memo {
  _id: string;
  zettelId: string;
  title: string;
  content: string;
  connections: Connection[];
  mentions: string[];
  tags: string[];
  connectionCount: number;
  createdAt: string;
  updatedAt: string;
}

// 메모 생성 요청
export interface CreateMemoRequest {
  title: string;
  content: string;
  tags?: string[];
}

// 메모 수정 요청
export interface UpdateMemoRequest {
  title?: string;
  content?: string;
  tags?: string[];
}

// 그래프 노드
export interface GraphNode {
  id: string;
  zettelId: string;
  title: string;
  connectionCount: number;
  level: number; // 0-4 (별 등급)
}

// 그래프 엣지
export interface GraphEdge {
  source: string;
  target: string;
  type: ConnectionType;
  strength: number;
}

// 그래프 데이터
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// API 응답 래퍼
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 페이지네이션
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
