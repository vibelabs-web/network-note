/**
 * RefineProgress - 비동기 LLM 재평가 진행 상태 컴포넌트
 * 작업 진행률을 시각적으로 표시하고 완료/실패 상태를 알림
 */

import { useEffect, useState, useCallback } from 'react';
import { getSuggestionStatus } from '@/api/suggestions';
import type { JobStatus, SuggestionListResponse } from '@/types';

interface RefineProgressProps {
  jobId: string;
  onComplete: (result: SuggestionListResponse) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
}

// 상태별 색상
function getStatusColor(status: JobStatus): string {
  switch (status) {
    case 'pending':
      return 'text-gray-400';
    case 'processing':
      return 'text-purple-400';
    case 'completed':
      return 'text-green-400';
    case 'failed':
      return 'text-red-400';
  }
}

// 상태별 레이블
function getStatusLabel(status: JobStatus): string {
  switch (status) {
    case 'pending':
      return '대기 중...';
    case 'processing':
      return 'AI 분석 중...';
    case 'completed':
      return '완료';
    case 'failed':
      return '실패';
  }
}

export function RefineProgress({
  jobId,
  onComplete,
  onError,
  onCancel,
}: RefineProgressProps) {
  const [status, setStatus] = useState<JobStatus>('pending');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  // 폴링 로직
  const pollStatus = useCallback(async () => {
    if (!jobId) return;

    try {
      const response = await getSuggestionStatus(jobId);
      setStatus(response.status);
      setProgress(response.progress);

      if (response.status === 'completed' && response.result) {
        onComplete(response.result);
      } else if (response.status === 'failed') {
        const errorMsg = response.error || 'AI 분석에 실패했습니다.';
        setError(errorMsg);
        onError(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '상태 조회 실패';
      setError(errorMsg);
      onError(errorMsg);
    }

    setPollCount((prev) => prev + 1);
  }, [jobId, onComplete, onError]);

  // 폴링 시작
  useEffect(() => {
    if (!jobId) return;

    // 즉시 첫 폴링
    pollStatus();

    // 주기적 폴링 (2초마다, 완료/실패까지)
    const intervalId = setInterval(() => {
      if (status === 'pending' || status === 'processing') {
        pollStatus();
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [jobId, status, pollStatus]);

  // 진행률 바 너비
  const progressWidth = `${Math.min(progress, 100)}%`;

  return (
    <div className="bg-[#2d2d2d] border border-purple-500/30 rounded-lg p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* 상태 아이콘 */}
          {(status === 'pending' || status === 'processing') && (
            <svg className="w-4 h-4 text-purple-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {status === 'completed' && (
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {status === 'failed' && (
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className={`text-sm font-medium ${getStatusColor(status)}`}>
            {getStatusLabel(status)}
          </span>
        </div>

        {/* 취소 버튼 */}
        {(status === 'pending' || status === 'processing') && onCancel && (
          <button
            onClick={onCancel}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            취소
          </button>
        )}
      </div>

      {/* 진행률 바 */}
      {(status === 'pending' || status === 'processing') && (
        <div className="mb-2">
          <div className="h-1.5 bg-[#3c3c3c] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-300"
              style={{ width: progressWidth }}
            />
          </div>
          <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
            <span>AI가 메모 연결 가치를 평가하고 있습니다</span>
            <span>{progress}%</span>
          </div>
        </div>
      )}

      {/* 완료 메시지 */}
      {status === 'completed' && (
        <div className="text-xs text-gray-400">
          분석이 완료되었습니다. 결과가 적용되었습니다.
        </div>
      )}

      {/* 에러 메시지 */}
      {status === 'failed' && error && (
        <div className="text-xs text-red-400">
          {error}
        </div>
      )}

      {/* 폴 카운트 (디버그용, 프로덕션에서는 숨김) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-[10px] text-gray-600 mt-2">
          Poll count: {pollCount} | Job ID: {jobId.slice(0, 12)}...
        </div>
      )}
    </div>
  );
}
