/**
 * MemoDetailPage - Scrivener 스타일 에디터
 * 깔끔하고 집중할 수 있는 글쓰기 환경
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMemoStore } from '@/stores/memoStore';
import { MarkdownPreview } from '@/components/MarkdownPreview';
import { MentionAutocomplete } from '@/components/MentionAutocomplete';
import { getCurrentMention, insertMention, type MentionType } from '@/utils/mentionParser';
import type { MemoNameSearchResult } from '@/types';

type ViewMode = 'edit' | 'preview' | 'split';

// 날짜 포맷팅
function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MemoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const {
    currentMemo,
    isLoadingDetail,
    isSaving,
    fetchMemo,
    createMemo,
    updateMemo,
    deleteMemo,
    clearCurrentMemo,
  } = useMemoStore();

  // 폼 상태
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('split');

  // 자동 저장 타이머
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // 멘션 자동완성 상태
  const [showMention, setShowMention] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [mentionRange, setMentionRange] = useState({ start: 0, end: 0 });
  const [mentionType, setMentionType] = useState<MentionType>('at');

  // 메모 로딩 및 폼 초기화
  useEffect(() => {
    if (isNew) {
      // 새 메모: 폼 초기화
      setTitle('');
      setContent('');
      setTagsInput('');
      setHasChanges(false);
      setSaveStatus('saved');
      setTimeout(() => titleInputRef.current?.focus(), 100);
    } else if (id) {
      fetchMemo(id);
    }
    return () => {
      clearCurrentMemo();
    };
  }, [id, isNew, fetchMemo, clearCurrentMemo]);

  // 메모 데이터로 폼 초기화
  useEffect(() => {
    if (currentMemo && !isNew) {
      setTitle(currentMemo.title);
      setContent(currentMemo.content);
      setTagsInput(currentMemo.tags.join(', '));
      setHasChanges(false);
      setSaveStatus('saved');
    }
  }, [currentMemo, isNew]);

  // 변경 감지
  useEffect(() => {
    if (isNew) {
      setHasChanges(title.trim() !== '' || content.trim() !== '');
    } else if (currentMemo) {
      const currentTags = tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      const originalTags = currentMemo.tags;
      const tagsChanged =
        currentTags.length !== originalTags.length ||
        !currentTags.every(t => originalTags.includes(t));

      setHasChanges(
        title !== currentMemo.title ||
        content !== currentMemo.content ||
        tagsChanged
      );
    }
  }, [title, content, tagsInput, currentMemo, isNew]);

  // 자동 저장
  useEffect(() => {
    if (!isNew && hasChanges && currentMemo) {
      setSaveStatus('unsaved');

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setTimeout(() => {
        handleSave();
      }, 2000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [title, content, tagsInput, hasChanges, isNew, currentMemo]);

  // 태그 파싱
  const parseTags = useCallback((input: string): string[] => {
    return input
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0);
  }, []);

  // 커서 위치에서 드롭다운 위치 계산
  const calculateMentionPosition = useCallback(() => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return { top: 0, left: 0 };

    // textarea의 위치 정보
    const rect = textarea.getBoundingClientRect();
    const computedStyle = getComputedStyle(textarea);
    const lineHeight = parseFloat(computedStyle.lineHeight) || 20;
    const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;

    // 커서 위치까지의 텍스트로 라인 수 계산
    const textBeforeCursor = content.slice(0, textarea.selectionStart);
    const lines = textBeforeCursor.split('\n');
    const currentLineIndex = lines.length - 1;
    const currentLineText = lines[currentLineIndex];

    // 대략적인 문자 너비 (monospace 폰트 가정)
    const charWidth = 8.5;

    // 위치 계산
    const top = rect.top + paddingTop + (currentLineIndex + 1) * lineHeight + 5;
    const left = rect.left + paddingLeft + currentLineText.length * charWidth;

    // 화면 경계 체크
    const maxLeft = window.innerWidth - 300; // 드롭다운 너비 고려
    const maxTop = window.innerHeight - 250; // 드롭다운 높이 고려

    return {
      top: Math.min(top, maxTop),
      left: Math.min(left, maxLeft),
    };
  }, [content]);

  // 콘텐츠 변경 처리 (멘션 감지 포함)
  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      const cursorPos = e.target.selectionStart;

      setContent(newContent);

      // 멘션 감지 (@ 또는 [[ 트리거)
      const mention = getCurrentMention(newContent, cursorPos);

      if (mention) {
        setMentionQuery(mention.mention);
        setMentionRange({ start: mention.startIndex, end: mention.endIndex });
        setMentionType(mention.type);
        setMentionPosition(calculateMentionPosition());
        setShowMention(true);
      } else {
        setShowMention(false);
        setMentionQuery('');
      }
    },
    [calculateMentionPosition]
  );

  // 멘션 선택 처리
  const handleMentionSelect = useCallback(
    (memo: MemoNameSearchResult) => {
      const { newText, newCursorPosition } = insertMention(
        content,
        mentionRange.start,
        mentionRange.end,
        memo.title,
        mentionType
      );

      setContent(newText);
      setShowMention(false);
      setMentionQuery('');

      // 커서 위치 복원
      setTimeout(() => {
        const textarea = contentTextareaRef.current;
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(newCursorPosition, newCursorPosition);
        }
      }, 0);
    },
    [content, mentionRange, mentionType]
  );

  // 멘션 닫기
  const handleMentionClose = useCallback(() => {
    setShowMention(false);
    setMentionQuery('');
  }, []);

  // 저장 핸들러
  const handleSave = useCallback(async () => {
    if (!title.trim()) return;

    setSaveStatus('saving');
    const tags = parseTags(tagsInput);

    try {
      if (isNew) {
        const newMemo = await createMemo({
          title: title.trim(),
          content: content.trim(),
          tags,
        });
        navigate(`/memos/${newMemo.id}`, { replace: true });
      } else if (id) {
        await updateMemo(id, {
          title: title.trim(),
          content: content.trim(),
          tags,
        });
        setSaveStatus('saved');
        setHasChanges(false);
      }
    } catch {
      setSaveStatus('unsaved');
    }
  }, [title, content, tagsInput, isNew, id, createMemo, updateMemo, navigate, parseTags]);

  // 삭제 핸들러
  const handleDelete = useCallback(async () => {
    if (!id || isNew) return;

    try {
      await deleteMemo(id);
      navigate('/');
    } catch {
      // 에러 처리
    }
    setShowDeleteConfirm(false);
  }, [id, isNew, deleteMemo, navigate]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (hasChanges || isNew) {
          handleSave();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, hasChanges, isNew]);

  // 로딩 상태
  if (!isNew && isLoadingDetail) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm">로딩 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* 에디터 툴바 */}
      <div className="h-9 flex items-center px-4 bg-[#2d2d2d] border-b border-[#3c3c3c] flex-shrink-0">
        {/* 저장 상태 */}
        <div className="flex items-center gap-2 text-xs">
          {saveStatus === 'saved' && (
            <span className="text-green-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              저장됨
            </span>
          )}
          {saveStatus === 'saving' && (
            <span className="text-yellow-500">저장 중...</span>
          )}
          {saveStatus === 'unsaved' && (
            <span className="text-gray-500">변경사항 있음</span>
          )}
        </div>

        {/* 우측 액션 */}
        <div className="ml-auto flex items-center gap-1">
          {/* 뷰 모드 전환 */}
          <div className="flex items-center bg-[#3c3c3c] rounded overflow-hidden mr-2">
            <button
              onClick={() => setViewMode('edit')}
              className={`px-2 py-1 text-xs transition-colors ${
                viewMode === 'edit' ? 'bg-[#094771] text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
              title="편집 모드"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-2 py-1 text-xs transition-colors ${
                viewMode === 'split' ? 'bg-[#094771] text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
              title="분할 모드"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-2 py-1 text-xs transition-colors ${
                viewMode === 'preview' ? 'bg-[#094771] text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
              title="미리보기 모드"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>

          {/* 메타데이터 토글 */}
          <button
            onClick={() => setShowMetadata(!showMetadata)}
            className={`p-1.5 rounded transition-colors ${
              showMetadata ? 'bg-[#094771] text-white' : 'hover:bg-[#3c3c3c] text-gray-400'
            }`}
            title="메타데이터"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* 삭제 버튼 */}
          {!isNew && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 rounded hover:bg-[#3c3c3c] text-gray-400 hover:text-red-400 transition-colors"
              title="삭제"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}

          {/* 저장 버튼 */}
          <button
            onClick={handleSave}
            disabled={isSaving || (!isNew && !hasChanges) || !title.trim()}
            className="px-3 py-1 text-xs bg-[#0e639c] hover:bg-[#1177bb] disabled:bg-[#3c3c3c] disabled:text-gray-500 rounded transition-colors ml-2"
          >
            {isSaving ? '저장 중...' : isNew ? '생성' : '저장'}
          </button>
        </div>
      </div>

      {/* 에디터 본문 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 에디터 패널 (edit 또는 split 모드) */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={`flex flex-col overflow-hidden ${viewMode === 'split' ? 'w-1/2 border-r border-[#3c3c3c]' : 'flex-1'}`}>
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-8 py-6">
                {/* 제목 */}
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="제목"
                  className="w-full text-2xl font-semibold bg-transparent border-none focus:outline-none text-gray-100 placeholder-gray-600 mb-4"
                />

                {/* 태그 입력 */}
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#3c3c3c]">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="태그 (쉼표로 구분)"
                    className="flex-1 text-sm bg-transparent border-none focus:outline-none text-gray-400 placeholder-gray-600"
                  />
                </div>

                {/* 본문 에디터 */}
                <div className="relative">
                  <textarea
                    ref={contentTextareaRef}
                    value={content}
                    onChange={handleContentChange}
                    placeholder="내용을 입력하세요...

마크다운 문법을 지원합니다.
@멘션으로 다른 메모와 연결할 수 있습니다."
                    className="w-full min-h-[400px] bg-transparent border-none focus:outline-none text-gray-300 placeholder-gray-600 resize-none leading-relaxed text-base font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 미리보기 패널 (preview 또는 split 모드) */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`flex flex-col overflow-hidden ${viewMode === 'split' ? 'w-1/2' : 'flex-1'}`}>
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-8 py-6">
                {/* 제목 미리보기 */}
                <h1 className="text-2xl font-semibold text-gray-100 mb-4">
                  {title || <span className="text-gray-600">제목 없음</span>}
                </h1>

                {/* 태그 미리보기 */}
                {tagsInput && (
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#3c3c3c]">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <div className="flex flex-wrap gap-1">
                      {tagsInput.split(',').filter(t => t.trim()).map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs bg-[#3c3c3c] text-gray-300 rounded">
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 본문 미리보기 */}
                <MarkdownPreview
                  content={content}
                  className="prose-invert prose-headings:text-gray-100 prose-p:text-gray-300 prose-a:text-blue-400 prose-strong:text-gray-200 prose-code:text-gray-300 prose-pre:bg-[#2d2d2d]"
                />
              </div>
            </div>
          </div>
        )}

        {/* 메타데이터 패널 */}
        {showMetadata && currentMemo && !isNew && (
          <div className="w-64 bg-[#252526] border-l border-[#3c3c3c] p-4 overflow-y-auto flex-shrink-0">
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
              메타데이터
            </h3>

            <div className="space-y-4 text-sm">
              <div>
                <div className="text-xs text-gray-500 mb-1">Zettel ID</div>
                <div className="text-gray-300 font-mono text-xs">{currentMemo.zettel_id}</div>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">생성</div>
                <div className="text-gray-300 text-xs">{formatDateTime(currentMemo.created_at)}</div>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">수정</div>
                <div className="text-gray-300 text-xs">{formatDateTime(currentMemo.updated_at)}</div>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">연결</div>
                <div className="text-gray-300 text-xs">{currentMemo.connection_count}개</div>
              </div>

              {currentMemo.connections.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-2">연결된 메모</div>
                  <div className="space-y-1">
                    {currentMemo.connections.map((conn) => (
                      <button
                        key={conn.target_id}
                        onClick={() => navigate(`/memos/${conn.target_id}`)}
                        className="block w-full text-left px-2 py-1 text-xs bg-[#3c3c3c] hover:bg-[#4c4c4c] rounded text-gray-300 truncate transition-colors"
                      >
                        {conn.target_title || conn.target_id}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#252526] rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-medium text-gray-200 mb-2">메모 삭제</h3>
            <p className="text-sm text-gray-400 mb-6">
              이 메모를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm text-gray-300 hover:bg-[#3c3c3c] rounded transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 멘션 자동완성 드롭다운 */}
      {showMention && (
        <MentionAutocomplete
          query={mentionQuery}
          position={mentionPosition}
          onSelect={handleMentionSelect}
          onClose={handleMentionClose}
          excludeId={isNew ? undefined : id}
        />
      )}
    </div>
  );
}
