/**
 * SuggestionCard - 연결 제안 카드 컴포넌트
 * 벡터 유사도 + LLM 기반 연결 제안을 표시하고 승인/거부할 수 있는 카드
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SuggestionItem } from '@/types';

interface SuggestionCardProps {
  suggestion: SuggestionItem;
  onApprove: (targetId: string) => Promise<void>;
  onReject: (targetId: string) => Promise<void>;
  isProcessing?: boolean;
}

// 유사도에 따른 색상 반환
function getSimilarityColor(similarity: number): string {
  if (similarity >= 0.8) return 'bg-green-500';
  if (similarity >= 0.6) return 'bg-yellow-500';
  if (similarity >= 0.4) return 'bg-orange-500';
  return 'bg-red-500';
}

// 유사도에 따른 레이블 반환
function getSimilarityLabel(similarity: number): string {
  if (similarity >= 0.8) return '높음';
  if (similarity >= 0.6) return '중간';
  if (similarity >= 0.4) return '낮음';
  return '매우 낮음';
}

// LLM 평가 여부 확인
function hasLlmEvaluation(suggestion: SuggestionItem): boolean {
  return suggestion.llmScore !== undefined && suggestion.llmScore > 0;
}

export function SuggestionCard({
  suggestion,
  onApprove,
  onReject,
  isProcessing = false,
}: SuggestionCardProps) {
  const navigate = useNavigate();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleApprove = async () => {
    if (isProcessing || isApproving || isRejecting) return;
    setIsApproving(true);
    try {
      await onApprove(suggestion.memoId);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (isProcessing || isApproving || isRejecting) return;
    setIsRejecting(true);
    try {
      await onReject(suggestion.memoId);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleNavigate = () => {
    navigate(`/memos/${suggestion.memoId}`);
  };

  const similarityPercent = Math.round(suggestion.similarity * 100);
  const isDisabled = isProcessing || isApproving || isRejecting;
  const isLlmAnalyzed = hasLlmEvaluation(suggestion);

  // 점수 정보
  const vectorScore = suggestion.vectorSimilarity ?? suggestion.similarity;
  const llmScore = suggestion.llmScore ?? 0;
  const vectorPercent = Math.round(vectorScore * 100);
  const llmPercent = Math.round(llmScore * 100);

  return (
    <div className="bg-[#2d2d2d] border border-[#3c3c3c] rounded-lg p-3 hover:border-[#4c4c4c] transition-colors group">
      {/* 상단: 제목 및 배지 */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <button
              onClick={handleNavigate}
              className="text-sm font-medium text-gray-200 hover:text-blue-400 transition-colors truncate block text-left"
              title={suggestion.title}
            >
              {suggestion.title}
            </button>
            {/* LLM 분석 배지 */}
            {isLlmAnalyzed && (
              <span className="flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI 분석
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-0.5 font-mono">
            {suggestion.zettelId}
          </div>
        </div>
      </div>

      {/* 하이브리드 점수 시각화 */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-400">
            {isLlmAnalyzed ? '하이브리드 점수' : '유사도'}
          </span>
          <div className="flex items-center gap-2">
            <span className={`${getSimilarityColor(suggestion.similarity).replace('bg-', 'text-')}`}>
              {similarityPercent}% ({getSimilarityLabel(suggestion.similarity)})
            </span>
            {/* 상세 점수 토글 버튼 */}
            {isLlmAnalyzed && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-gray-500 hover:text-gray-300 transition-colors"
                title="점수 상세 보기"
              >
                <svg className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="h-1.5 bg-[#3c3c3c] rounded-full overflow-hidden">
          <div
            className={`h-full ${getSimilarityColor(suggestion.similarity)} transition-all duration-300`}
            style={{ width: `${similarityPercent}%` }}
          />
        </div>

        {/* 상세 점수 (LLM 분석된 경우) */}
        {isLlmAnalyzed && showDetails && (
          <div className="mt-2 pt-2 border-t border-[#3c3c3c] space-y-1.5">
            {/* 벡터 유사도 */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500 w-16">벡터</span>
              <div className="flex-1 h-1 bg-[#3c3c3c] rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${vectorPercent}%` }}
                />
              </div>
              <span className="text-gray-400 w-8 text-right">{vectorPercent}%</span>
            </div>
            {/* LLM 점수 */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500 w-16">AI</span>
              <div className="flex-1 h-1 bg-[#3c3c3c] rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${llmPercent}%` }}
                />
              </div>
              <span className="text-gray-400 w-8 text-right">{llmPercent}%</span>
            </div>
            <div className="text-[10px] text-gray-600 mt-1">
              하이브리드 = 벡터(40%) + AI(60%)
            </div>
          </div>
        )}
      </div>

      {/* 제안 이유 (LLM 생성) */}
      <div className={`text-xs mb-3 ${isLlmAnalyzed ? 'text-gray-400' : 'text-gray-500'}`}>
        {isLlmAnalyzed && (
          <span className="inline-flex items-center gap-1 text-purple-400 mr-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8.5 2c1.1 0 2 .9 2 2v1c0 .17.17.34.35.5l.7.7c.6.6.95 1.42.95 2.26V9c0 1-.5 2-1.5 2.5v2c0 .55-.45 1-1 1s-1-.45-1-1v-1.5H8v1.5c0 .55-.45 1-1 1s-1-.45-1-1v-2C5.5 11 5 10 5 9V8.46c0-.84.35-1.66.95-2.26l.7-.7c.18-.16.35-.33.35-.5V4c0-1.1.9-2 2-2zm5.5 0c1.1 0 2 .9 2 2v1c0 .17.17.34.35.5l.7.7c.6.6.95 1.42.95 2.26V9c0 1-.5 2-1.5 2.5v2c0 .55-.45 1-1 1s-1-.45-1-1v-1.5h-.5v1.5c0 .55-.45 1-1 1s-1-.45-1-1v-2c-1-.5-1.5-1.5-1.5-2.5V8.46c0-.84.35-1.66.95-2.26l.7-.7c.18-.16.35-.33.35-.5V4c0-1.1.9-2 2-2z"/>
            </svg>
          </span>
        )}
        {suggestion.reason}
      </div>

      {/* 내용 미리보기 토글 */}
      {suggestion.contentPreview && (
        <div className="mb-3">
          <button
            onClick={() => setShowContent(!showContent)}
            className="text-xs text-gray-400 hover:text-gray-300 flex items-center gap-1 transition-colors"
          >
            <svg
              className={`w-3 h-3 transition-transform ${showContent ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            내용 미리보기
          </button>
          {showContent && (
            <div className="mt-2 p-2 bg-[#252526] rounded text-xs text-gray-400 line-clamp-3">
              {suggestion.contentPreview}
            </div>
          )}
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleApprove}
          disabled={isDisabled}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs bg-[#0e639c] hover:bg-[#1177bb] disabled:bg-[#3c3c3c] disabled:text-gray-500 text-white rounded transition-colors"
        >
          {isApproving ? (
            <>
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              처리 중...
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              연결하기
            </>
          )}
        </button>
        <button
          onClick={handleReject}
          disabled={isDisabled}
          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-[#3c3c3c] disabled:opacity-50 disabled:hover:text-gray-400 disabled:hover:bg-transparent rounded transition-colors"
          title="거부"
        >
          {isRejecting ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
