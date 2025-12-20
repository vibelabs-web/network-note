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

// 메모명 검색 결과 (멘션 자동완성용)
export interface MemoNameSearchResult {
  id: string;
  title: string;
  zettel_id: string;
}

// 메모명 검색 응답
export interface MemoNameSearchResponse {
  results: MemoNameSearchResult[];
  total: number;
}

// 연결 생성 요청
export interface CreateConnectionRequest {
  source_id: string;
  target_id: string;
  type?: ConnectionType;
  strength?: number;
  reason?: string;
}

// 연결 삭제 요청
export interface DeleteConnectionRequest {
  source_id: string;
  target_id: string;
}

// 연결 정보 (상세)
export interface ConnectionInfo {
  target_id: string;
  target_title?: string;
  target_zettel_id?: string;
  type: ConnectionType;
  strength: number;
  reason?: string;
  created_at: string;
}

// 연결 목록 응답
export interface ConnectionListResponse {
  memo_id: string;
  connections: ConnectionInfo[];
  total: number;
}

// 연결 제안 항목
export interface SuggestionItem {
  memoId: string;
  title: string;
  zettelId: string;
  similarity: number;
  reason: string;
  contentPreview?: string;
  llmScore?: number;         // LLM 평가 점수
  vectorSimilarity?: number; // 벡터 유사도 (하이브리드 모드)
}

// 연결 제안 응답
export interface SuggestionListResponse {
  suggestions: SuggestionItem[];
  sourceMemoId: string;
  threshold: number;
  total: number;
}

// 제안 승인/거부 응답
export interface SuggestionActionResponse {
  message: string;
  sourceId: string;
  targetId: string;
  action: 'approved' | 'rejected';
  success: boolean;
}

// 비동기 LLM 재평가 요청
export interface RefineRequest {
  memoId: string;
  candidateIds?: string[];
  limit?: number;
  threshold?: number;
}

// 비동기 LLM 재평가 응답
export interface RefineResponse {
  jobId: string;
  memoId: string;
  candidateCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
}

// 작업 상태
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

// 작업 상태 조회 응답
export interface JobStatusResponse {
  jobId: string;
  status: JobStatus;
  progress: number;
  memoId?: string;
  result?: SuggestionListResponse;
  error?: string;
  createdAt?: string;
  completedAt?: string;
}
