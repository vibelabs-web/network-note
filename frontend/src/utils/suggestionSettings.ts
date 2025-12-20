/**
 * Suggestion Settings - 로컬 스토리지 기반 제안 설정 관리
 */

const STORAGE_KEY = 'star-note-suggestion-settings';

export interface SuggestionSettings {
  useLlm: boolean;           // LLM 평가 사용 여부
  autoRefine: boolean;       // 자동 재평가 사용 여부
  threshold: number;         // 유사도 임계값 (0.0 ~ 1.0)
  limit: number;             // 제안 개수 (1 ~ 20)
}

const DEFAULT_SETTINGS: SuggestionSettings = {
  useLlm: true,
  autoRefine: false,
  threshold: 0.3,
  limit: 10,
};

/**
 * 설정 로드
 */
export function loadSuggestionSettings(): SuggestionSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
      };
    }
  } catch (e) {
    console.warn('Failed to load suggestion settings:', e);
  }
  return DEFAULT_SETTINGS;
}

/**
 * 설정 저장
 */
export function saveSuggestionSettings(settings: Partial<SuggestionSettings>): SuggestionSettings {
  const current = loadSuggestionSettings();
  const updated = {
    ...current,
    ...settings,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save suggestion settings:', e);
  }

  return updated;
}

/**
 * 설정 초기화
 */
export function resetSuggestionSettings(): SuggestionSettings {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to reset suggestion settings:', e);
  }
  return DEFAULT_SETTINGS;
}
