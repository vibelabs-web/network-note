/**
 * API Client - Axios 인스턴스 설정
 */

import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// 환경 변수에서 API URL 읽기
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

// Axios 인스턴스 생성
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 60000, // LLM 평가 시간 고려 (Solar Pro 22B: ~20초/건)
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 개발 환경에서 요청 로깅
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 개발 환경에서 응답 로깅
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error: AxiosError) => {
    // 에러 처리
    if (error.response) {
      // 서버가 응답한 에러
      console.error(
        `[API Error] ${error.response.status} ${error.config?.url}`,
        error.response.data
      );
    } else if (error.request) {
      // 요청은 보냈지만 응답이 없음
      console.error('[API Error] No response received', error.request);
    } else {
      // 요청 설정 중 에러
      console.error('[API Error]', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
