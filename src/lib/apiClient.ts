import { AxiosError, create, type AxiosRequestConfig } from 'axios';

import { ApiError, type ApiResponse } from '@/shared/types/api';

import { tokenStorage } from './tokenStorage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
    console.warn(
        'EXPO_PUBLIC_API_URL이 설정되지 않았습니다. .env.example을 참고해 .env를 만들어 주세요.',
    );
}

export const apiClient = create({
    baseURL: `${API_URL}/api/v1`,
    timeout: 10_000,
    headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
    const accessToken = await tokenStorage.getAccessToken();
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

/**
 * 공통 래퍼를 벗겨 `result`만 반환하고, 실패는 ApiError로 통일한다.
 * 각 feature의 api/ 요청 함수에서 이 함수를 사용한다.
 */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
        const { data } = await apiClient.request<ApiResponse<T>>(config);
        if (!data.isSuccess) {
            throw new ApiError(data.code, data.message);
        }
        return data.result;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        if (error instanceof AxiosError) {
            const body = error.response?.data as Partial<ApiResponse<unknown>> | undefined;
            throw new ApiError(
                body?.code ?? 'NETWORK_ERROR',
                body?.message ?? '네트워크 연결을 확인해 주세요.',
                error.response?.status,
            );
        }
        throw error;
    }
}
