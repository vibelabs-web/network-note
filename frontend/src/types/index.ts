/**
 * Star Note - 타입 정의
 */

// 메모 연결 타입
export type ConnectionType = 'explicit' | 'suggested';

// 메모 연결
export interface Connection {
  target_id: string;
  type: ConnectionType;
  strength: number;
  created_at: string;
  // 연결된 메모 정보 (상세 조회 시 포함)
  target_title?: string;
  target_zettel_id?: string;
}

// 메모
export interface Memo {
  id: string;
  zettel_id: string;
  title: string;
  content: string;
  connections: Connection[];
  mentions: string[];
  tags: string[];
  connection_count: number;
  created_at: string;
  updated_at: string;
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
  page_size: number;
  total_pages: number;
}
