# Star Note - 서비스 플로우차트

**버전:** 1.0  
**작성일:** 2024-12-25  
**목적:** Star Note 서비스의 주요 기능별 플로우를 시각화

---

## 목차

1. [전체 시스템 아키텍처](#전체-시스템-아키텍처)
2. [메모 작성/편집 플로우](#메모-작성편집-플로우)
3. [멘션 처리 플로우](#멘션-처리-플로우)
4. [AI 연결 제안 플로우](#ai-연결-제안-플로우)
5. [그래프 시각화 플로우](#그래프-시각화-플로우)
6. [메모 검색 플로우](#메모-검색-플로우)
7. [연결 승인/거부 플로우](#연결-승인거부-플로우)

---

## 전체 시스템 아키텍처

```mermaid
graph TB
    subgraph "Frontend (React + TypeScript)"
        UI[사용자 인터페이스]
        Editor[마크다운 에디터]
        GraphView[그래프 뷰]
        ListView[메모 목록 뷰]
    end
    
    subgraph "Backend (FastAPI)"
        API[REST API]
        MemoService[메모 서비스]
        ConnectionService[연결 서비스]
        SuggestionService[제안 서비스]
        EmbeddingService[임베딩 서비스]
        LLMService[LLM 서비스]
    end
    
    subgraph "데이터 저장소"
        MongoDB[(MongoDB<br/>메모 데이터)]
        ChromaDB[(ChromaDB<br/>벡터 임베딩)]
    end
    
    subgraph "외부 서비스"
        Ollama[Ollama<br/>LLM 실행]
    end
    
    UI --> Editor
    UI --> GraphView
    UI --> ListView
    
    Editor --> API
    GraphView --> API
    ListView --> API
    
    API --> MemoService
    API --> ConnectionService
    API --> SuggestionService
    
    MemoService --> MongoDB
    ConnectionService --> MongoDB
    SuggestionService --> EmbeddingService
    SuggestionService --> LLMService
    
    EmbeddingService --> ChromaDB
    LLMService --> Ollama
    
    style UI fill:#e1f5ff
    style API fill:#fff4e1
    style MongoDB fill:#e8f5e9
    style ChromaDB fill:#e8f5e9
    style Ollama fill:#fce4ec
```

---

## 메모 작성/편집 플로우

```mermaid
flowchart TD
    Start([사용자가 메모 작성/편집 시작]) --> Input[제목 및 내용 입력]
    Input --> AutoSave{자동 저장<br/>디바운싱}
    AutoSave -->|500ms 후| ParseMentions[멘션 파싱<br/>@메모명 추출]
    
    ParseMentions --> HasMentions{멘션<br/>존재?}
    HasMentions -->|Yes| ValidateMentions[멘션된 메모<br/>존재 확인]
    HasMentions -->|No| SaveMemo
    
    ValidateMentions --> Valid{모든 멘션<br/>유효?}
    Valid -->|No| ShowError[에러 메시지 표시]
    Valid -->|Yes| SaveMemo[메모 저장<br/>MongoDB]
    
    ShowError --> Input
    
    SaveMemo --> GenerateZettelId[Zettel ID 생성<br/>YYYY-MM-DD-XXX]
    GenerateZettelId --> CreateConnections[멘션 기반<br/>연결 생성]
    
    CreateConnections --> UpdateConnectionCount[연결 수 업데이트]
    UpdateConnectionCount --> GenerateEmbedding[임베딩 생성<br/>백그라운드]
    
    GenerateEmbedding --> SaveToChromaDB[ChromaDB에<br/>임베딩 저장]
    SaveToChromaDB --> ShowSuggestions[연결 제안 표시]
    
    ShowSuggestions --> End([완료])
    
    style Start fill:#e1f5ff
    style End fill:#c8e6c9
    style ShowError fill:#ffcdd2
    style GenerateEmbedding fill:#fff9c4
```

---

## 멘션 처리 플로우

```mermaid
flowchart TD
    Start([사용자가 @ 입력]) --> ShowDropdown[자동완성 드롭다운 표시]
    ShowDropdown --> UserInput[사용자 입력<br/>검색어]
    
    UserInput --> Debounce{디바운싱<br/>500ms}
    Debounce -->|대기| UserInput
    Debounce -->|완료| SearchAPI[메모명 검색 API 호출]
    
    SearchAPI --> FilterResults[결과 필터링<br/>제목/Zettel ID]
    FilterResults --> DisplayResults[드롭다운에<br/>결과 표시]
    
    DisplayResults --> UserSelect{사용자 선택?}
    UserSelect -->|키보드 화살표| Navigate[항목 이동]
    UserSelect -->|Enter 키| InsertMention[멘션 텍스트 삽입<br/>@메모제목]
    UserSelect -->|Escape 키| CloseDropdown[드롭다운 닫기]
    
    Navigate --> DisplayResults
    
    InsertMention --> HighlightMention[멘션 하이라이팅]
    HighlightMention --> SaveMemo[메모 저장 시<br/>연결 자동 생성]
    
    SaveMemo --> CreateExplicitConnection[명시적 연결 생성<br/>양방향]
    CreateExplicitConnection --> End([완료])
    
    CloseDropdown --> End
    
    style Start fill:#e1f5ff
    style End fill:#c8e6c9
    style InsertMention fill:#fff9c4
```

---

## AI 연결 제안 플로우

```mermaid
flowchart TD
    Start([메모 저장 완료 또는<br/>제안 요청]) --> GetEmbedding[메모 임베딩 가져오기]
    
    GetEmbedding --> VectorSearch[벡터 유사도 검색<br/>ChromaDB]
    
    VectorSearch --> FilterCandidates[후보 필터링<br/>- 이미 연결된 메모 제외<br/>- 자기 자신 제외<br/>- 유사도 임계값 이상]
    
    FilterCandidates --> UseLLM{LLM 재평가<br/>사용?}
    
    UseLLM -->|No| SortBySimilarity[유사도 점수로 정렬]
    UseLLM -->|Yes| SelectTopCandidates[상위 10개 후보 선택]
    
    SelectTopCandidates --> LLMEvaluation[LLM으로<br/>의미적 연결 평가]
    
    LLMEvaluation --> ParseLLMResponse[LLM 응답 파싱<br/>- 연결 강도 점수<br/>- 연결 이유]
    
    ParseLLMResponse --> CalculateHybridScore[하이브리드 점수 계산<br/>벡터 유사도 + LLM 점수]
    
    CalculateHybridScore --> SortByHybridScore[하이브리드 점수로 정렬]
    SortBySimilarity --> FormatSuggestions[제안 형식화]
    SortByHybridScore --> FormatSuggestions
    
    FormatSuggestions --> ReturnSuggestions[제안 목록 반환<br/>최대 10개]
    
    ReturnSuggestions --> DisplayUI[UI에 제안 표시<br/>- 제목<br/>- 유사도 점수<br/>- 연결 이유]
    
    DisplayUI --> UserAction{사용자 액션}
    
    UserAction -->|승인| ApproveConnection[명시적 연결로 변환<br/>양방향 연결 생성]
    UserAction -->|거부| RejectSuggestion[제안 거부<br/>목록에서 제거]
    UserAction -->|무시| KeepSuggestion[제안 유지<br/>suggested 타입]
    
    ApproveConnection --> UpdateGraph[그래프 업데이트]
    RejectSuggestion --> End([완료])
    KeepSuggestion --> End
    UpdateGraph --> End
    
    style Start fill:#e1f5ff
    style End fill:#c8e6c9
    style LLMEvaluation fill:#fff9c4
    style ApproveConnection fill:#c8e6c9
```

---

## 그래프 시각화 플로우

```mermaid
flowchart TD
    Start([그래프 뷰 진입]) --> LoadGraphData[그래프 데이터 API 호출<br/>GET /api/graph]
    
    LoadGraphData --> ApplyFilters{필터 적용?}
    ApplyFilters -->|Yes| FilterNodes[노드 필터링<br/>- 태그<br/>- 최소 연결 수<br/>- 검색어]
    ApplyFilters -->|No| ProcessData
    
    FilterNodes --> ProcessData[데이터 처리<br/>- 노드 생성<br/>- 엣지 생성<br/>- 별 등급 계산]
    
    ProcessData --> CalculateStarLevel[별 등급 계산<br/>0: 외로운 별 0개<br/>1: 작은 별 1-2개<br/>2: 중간 별 3-5개<br/>3: 큰 별 6-10개<br/>4: 중심 별 10개+]
    
    CalculateStarLevel --> InitializeD3[D3.js Force Simulation 초기화]
    
    InitializeD3 --> SetupForces[Force 설정<br/>- 반발력<br/>- 인력<br/>- 중심력]
    
    SetupForces --> RenderNodes[노드 렌더링<br/>- 크기: 등급별<br/>- 밝기: 등급별<br/>- 색상: 태그별]
    
    RenderNodes --> RenderEdges[엣지 렌더링<br/>- 명시적: 실선<br/>- 제안: 점선]
    
    RenderEdges --> StartAnimation[애니메이션 시작<br/>Force-directed layout]
    
    StartAnimation --> UserInteraction{사용자 인터랙션}
    
    UserInteraction -->|드래그| DragNode[노드 위치 조정]
    UserInteraction -->|줌| ZoomGraph[그래프 확대/축소]
    UserInteraction -->|팬| PanGraph[그래프 이동]
    UserInteraction -->|노드 클릭| ShowNodeInfo[노드 정보 패널 표시]
    UserInteraction -->|노드 더블클릭| NavigateToMemo[메모 상세 페이지로 이동]
    
    DragNode --> UpdateLayout[레이아웃 업데이트]
    ZoomGraph --> UpdateView[뷰 업데이트]
    PanGraph --> UpdateView
    ShowNodeInfo --> DisplayConnections[연결된 메모 목록 표시]
    NavigateToMemo --> End([완료])
    
    UpdateLayout --> UserInteraction
    UpdateView --> UserInteraction
    DisplayConnections --> UserInteraction
    
    style Start fill:#e1f5ff
    style End fill:#c8e6c9
    style CalculateStarLevel fill:#fff9c4
    style NavigateToMemo fill:#c8e6c9
```

---

## 메모 검색 플로우

```mermaid
flowchart TD
    Start([사용자가 검색어 입력]) --> Debounce{디바운싱<br/>300ms}
    
    Debounce -->|대기| Start
    Debounce -->|완료| CheckQuery{검색어<br/>존재?}
    
    CheckQuery -->|No| ShowAll[전체 메모 표시]
    CheckQuery -->|Yes| DetermineSearchType{검색 타입<br/>판단}
    
    DetermineSearchType -->|Zettel ID 형식| SearchByZettelId[Zettel ID로 검색<br/>정확 일치]
    DetermineSearchType -->|일반 텍스트| SearchByText[텍스트 검색<br/>제목 + 내용]
    DetermineSearchType -->|태그 형식| SearchByTag[태그로 검색]
    
    SearchByZettelId --> ExecuteMongoQuery[MongoDB 쿼리 실행]
    SearchByText --> ExecuteMongoQuery
    SearchByTag --> ExecuteMongoQuery
    
    ExecuteMongoQuery --> ApplySorting[정렬 적용<br/>- 최신순<br/>- 수정순<br/>- 연결순<br/>- 제목순]
    
    ApplySorting --> Paginate[페이지네이션<br/>기본 20개/페이지]
    
    Paginate --> HighlightResults[검색어 하이라이팅<br/>결과에 표시]
    
    HighlightResults --> DisplayResults[검색 결과 표시<br/>- 제목<br/>- 미리보기<br/>- 태그<br/>- 연결 수]
    
    DisplayResults --> UserAction{사용자 액션}
    
    UserAction -->|메모 클릭| NavigateToDetail[메모 상세 페이지]
    UserAction -->|필터 추가| ApplyFilter[추가 필터 적용<br/>태그, 날짜 등]
    UserAction -->|정렬 변경| ApplySorting
    
    NavigateToDetail --> End([완료])
    ApplyFilter --> ExecuteMongoQuery
    ShowAll --> End
    
    style Start fill:#e1f5ff
    style End fill:#c8e6c9
    style HighlightResults fill:#fff9c4
```

---

## 연결 승인/거부 플로우

```mermaid
flowchart TD
    Start([사용자가 제안 카드 확인]) --> DisplaySuggestion[제안 카드 표시<br/>- 메모 제목<br/>- 유사도 점수<br/>- 연결 이유]
    
    DisplaySuggestion --> UserDecision{사용자 결정}
    
    UserDecision -->|승인| ApproveAPI[승인 API 호출<br/>POST /api/suggestions/approve]
    UserDecision -->|거부| RejectAPI[거부 API 호출<br/>POST /api/suggestions/reject]
    UserDecision -->|무시| KeepSuggestion[제안 유지<br/>아무 액션 없음]
    
    ApproveAPI --> ValidateConnection[연결 유효성 검증<br/>- 메모 존재 확인<br/>- 중복 연결 확인]
    
    ValidateConnection --> Valid{유효한<br/>연결?}
    
    Valid -->|No| ShowError[에러 메시지 표시]
    Valid -->|Yes| CreateExplicitConnection[명시적 연결 생성<br/>type: explicit]
    
    CreateExplicitConnection --> UpdateSourceMemo[소스 메모 업데이트<br/>connections 배열에 추가]
    UpdateSourceMemo --> UpdateTargetMemo[타겟 메모 업데이트<br/>양방향 연결 추가]
    
    UpdateTargetMemo --> UpdateConnectionCount[연결 수 업데이트<br/>양쪽 메모 모두]
    
    UpdateConnectionCount --> RemoveFromSuggestions[제안 목록에서 제거]
    RemoveFromSuggestions --> UpdateUI[UI 업데이트<br/>- 제안 목록 갱신<br/>- 그래프 업데이트]
    
    RejectAPI --> RecordRejection[거부 기록 저장<br/>선택사항]
    RecordRejection --> RemoveFromSuggestions
    
    ShowError --> DisplaySuggestion
    UpdateUI --> End([완료])
    KeepSuggestion --> End
    
    style Start fill:#e1f5ff
    style End fill:#c8e6c9
    style CreateExplicitConnection fill:#c8e6c9
    style ShowError fill:#ffcdd2
```

---

## 데이터 흐름 다이어그램

```mermaid
sequenceDiagram
    participant User as 사용자
    participant Frontend as 프론트엔드
    participant API as Backend API
    participant MongoDB as MongoDB
    participant ChromaDB as ChromaDB
    participant Ollama as Ollama
    
    User->>Frontend: 메모 작성
    Frontend->>API: POST /api/memos
    API->>MongoDB: 메모 저장
    MongoDB-->>API: 저장 완료
    
    API->>API: 멘션 파싱
    API->>MongoDB: 연결 생성 (양방향)
    
    API->>ChromaDB: 임베딩 저장 (백그라운드)
    
    API-->>Frontend: 메모 생성 완료
    
    Frontend->>API: GET /api/memos/{id}/suggestions
    API->>ChromaDB: 벡터 유사도 검색
    ChromaDB-->>API: 유사 메모 목록
    
    API->>Ollama: LLM 재평가 (선택적)
    Ollama-->>API: 연결 강도 및 이유
    
    API-->>Frontend: 제안 목록 반환
    Frontend-->>User: 제안 표시
    
    User->>Frontend: 제안 승인
    Frontend->>API: POST /api/suggestions/approve
    API->>MongoDB: 명시적 연결 생성
    MongoDB-->>API: 연결 완료
    API-->>Frontend: 승인 완료
    Frontend-->>User: UI 업데이트
```

---

## 주요 상태 전이 다이어그램

```mermaid
stateDiagram-v2
    [*] --> Draft: 메모 작성 시작
    
    Draft --> Saving: 자동 저장 트리거
    Saving --> Saved: 저장 완료
    Saved --> Draft: 내용 수정
    
    Saved --> Processing: 임베딩 생성 시작
    Processing --> Processed: 임베딩 완료
    
    Processed --> Suggesting: 연결 제안 요청
    Suggesting --> Suggested: 제안 생성 완료
    
    Suggested --> Approved: 제안 승인
    Suggested --> Rejected: 제안 거부
    Suggested --> Ignored: 제안 무시
    
    Approved --> Connected: 연결 생성 완료
    Rejected --> [*]
    Ignored --> [*]
    
    Connected --> [*]
    
    note right of Processing
        백그라운드 작업
        UI 블로킹 없음
    end note
    
    note right of Suggesting
        벡터 검색 + LLM 평가
        비동기 처리 가능
    end note
```

---

## 기술 스택별 책임 분리

```mermaid
graph LR
    subgraph "Frontend"
        React[React<br/>UI 렌더링]
        Zustand[Zustand<br/>상태 관리]
        D3[D3.js<br/>그래프 시각화]
        Markdown[react-markdown<br/>마크다운 렌더링]
    end
    
    subgraph "Backend"
        FastAPI[FastAPI<br/>REST API]
        Pydantic[Pydantic<br/>데이터 검증]
        Services[서비스 레이어<br/>비즈니스 로직]
    end
    
    subgraph "데이터"
        MongoDB[MongoDB<br/>구조화된 데이터]
        ChromaDB[ChromaDB<br/>벡터 데이터]
    end
    
    subgraph "AI"
        Ollama[Ollama<br/>LLM 실행]
        Embedding[Sentence Transformers<br/>임베딩 생성]
    end
    
    React --> FastAPI
    Zustand --> React
    D3 --> React
    Markdown --> React
    
    FastAPI --> Services
    Services --> MongoDB
    Services --> ChromaDB
    Services --> Ollama
    Services --> Embedding
    
    style React fill:#e1f5ff
    style FastAPI fill:#fff4e1
    style MongoDB fill:#e8f5e9
    style ChromaDB fill:#e8f5e9
    style Ollama fill:#fce4ec
```

---

## 부록: 주요 API 플로우

### 메모 CRUD 플로우

```mermaid
flowchart LR
    Create[POST /api/memos<br/>메모 생성] --> Read[GET /api/memos<br/>목록 조회]
    Read --> Detail[GET /api/memos/{id}<br/>상세 조회]
    Detail --> Update[PUT /api/memos/{id}<br/>메모 수정]
    Update --> Delete[DELETE /api/memos/{id}<br/>메모 삭제]
    
    style Create fill:#c8e6c9
    style Read fill:#e1f5ff
    style Update fill:#fff9c4
    style Delete fill:#ffcdd2
```

### 연결 관리 플로우

```mermaid
flowchart TD
    A[명시적 연결<br/>멘션 기반] --> B[제안 연결<br/>AI 기반]
    B --> C[연결 승인]
    C --> A
    
    A --> D[연결 삭제]
    C --> D
    
    style A fill:#c8e6c9
    style B fill:#fff9c4
    style C fill:#c8e6c9
    style D fill:#ffcdd2
```

---

**문서 관리**
- 이 플로우차트는 시스템 변경 시 업데이트됩니다.
- 각 플로우는 실제 구현과 일치하도록 유지됩니다.
