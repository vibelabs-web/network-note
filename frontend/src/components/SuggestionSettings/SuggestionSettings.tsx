/**
 * SuggestionSettings - 제안 설정 컴포넌트
 * AI 제안 기능의 옵션을 설정할 수 있는 토글 스위치 UI
 */

import { useState, useEffect, useCallback } from 'react';
import { loadSuggestionSettings, saveSuggestionSettings, type SuggestionSettings as Settings } from '@/utils/suggestionSettings';

interface SuggestionSettingsProps {
  onSettingsChange?: (settings: Settings) => void;
  compact?: boolean; // 컴팩트 모드 (토글만 표시)
}

// 토글 스위치 컴포넌트
function ToggleSwitch({
  enabled,
  onChange,
  disabled = false,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#252526] ${
        disabled
          ? 'bg-[#3c3c3c] cursor-not-allowed'
          : enabled
          ? 'bg-purple-600'
          : 'bg-[#4c4c4c]'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export function SuggestionSettings({
  onSettingsChange,
  compact = false,
}: SuggestionSettingsProps) {
  const [settings, setSettings] = useState<Settings>(loadSuggestionSettings);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 설정 변경 핸들러
  const handleSettingChange = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      const updated = saveSuggestionSettings({ [key]: value });
      setSettings(updated);
      onSettingsChange?.(updated);
    },
    [onSettingsChange]
  );

  // 초기 로드 시 콜백 호출
  useEffect(() => {
    onSettingsChange?.(settings);
  }, []);

  // 컴팩트 모드: LLM 토글만 표시
  if (compact) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="text-xs text-gray-400">AI 분석</span>
        </div>
        <ToggleSwitch
          enabled={settings.useLlm}
          onChange={(value) => handleSettingChange('useLlm', value)}
        />
      </div>
    );
  }

  // 전체 설정 UI
  return (
    <div className="space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          제안 설정
        </h4>
      </div>

      {/* AI 분석 토글 */}
      <div className="bg-[#2d2d2d] border border-[#3c3c3c] rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-sm text-gray-200">고급 AI 제안</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              LLM을 사용하여 더 정확한 연결 제안을 받습니다
            </p>
          </div>
          <ToggleSwitch
            enabled={settings.useLlm}
            onChange={(value) => handleSettingChange('useLlm', value)}
          />
        </div>

        {/* AI 분석 활성화 시 추가 정보 */}
        {settings.useLlm && (
          <div className="mt-3 pt-3 border-t border-[#3c3c3c] text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-purple-500" />
              벡터 유사도(40%) + AI 평가(60%) 하이브리드 점수 사용
            </div>
          </div>
        )}
      </div>

      {/* 고급 설정 토글 */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
      >
        <svg
          className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        고급 설정
      </button>

      {/* 고급 설정 패널 */}
      {showAdvanced && (
        <div className="bg-[#2d2d2d] border border-[#3c3c3c] rounded-lg p-3 space-y-3">
          {/* 유사도 임계값 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">유사도 임계값</span>
              <span className="text-xs text-gray-500">{Math.round(settings.threshold * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.threshold * 100}
              onChange={(e) => handleSettingChange('threshold', parseInt(e.target.value) / 100)}
              className="w-full h-1 bg-[#3c3c3c] rounded-lg appearance-none cursor-pointer slider-purple"
            />
            <div className="flex justify-between text-[10px] text-gray-600 mt-1">
              <span>느슨함</span>
              <span>엄격함</span>
            </div>
          </div>

          {/* 제안 개수 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">제안 개수</span>
              <span className="text-xs text-gray-500">{settings.limit}개</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={settings.limit}
              onChange={(e) => handleSettingChange('limit', parseInt(e.target.value))}
              className="w-full h-1 bg-[#3c3c3c] rounded-lg appearance-none cursor-pointer slider-purple"
            />
            <div className="flex justify-between text-[10px] text-gray-600 mt-1">
              <span>적게 (1)</span>
              <span>많이 (20)</span>
            </div>
          </div>
        </div>
      )}

      {/* 스타일 추가 */}
      <style>{`
        .slider-purple::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #a855f7;
          cursor: pointer;
        }
        .slider-purple::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #a855f7;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
