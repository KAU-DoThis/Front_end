import axios, { AxiosError, create, type AxiosRequestConfig } from 'axios';

import {
    ApiError,
    HTTP_ERROR_CODE,
    NETWORK_ERROR_CODE,
    type ApiResponse,
} from '@/shared/types/api';

import { tokenStorage } from './tokenStorage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
    console.warn(
        'EXPO_PUBLIC_API_URL이 설정되지 않았습니다. .env.example을 참고해 .env를 만들어 주세요.',
    );
}

const BASE_URL = `${API_URL}/api/v1`;
const TIMEOUT_MS = 10_000;

export const apiClient = create({
    baseURL: BASE_URL,
    timeout: TIMEOUT_MS,
    headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
    // 요청에서 직접 토큰을 넣은 경우(가입 직후 동의 저장 등)는 그대로 둔다.
    if (config.headers.Authorization) {
        return config;
    }
    const accessToken = await tokenStorage.getAccessToken();
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

/** 재발급까지 실패해 다시 로그인해야 할 때 부른다. authStore가 등록한다. */
let handleSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(handler: () => void) {
    handleSessionExpired = handler;
}

interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

/**
 * 리프레시 토큰은 한 번만 쓸 수 있어서, 여러 요청이 동시에 401을 받아도 재발급은 한 번만 보낸다.
 * 진행 중인 재발급이 있으면 그 결과를 같이 기다린다.
 */
let reissuePromise: Promise<string | null> | null = null;

async function reissueAccessToken(): Promise<string | null> {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken) {
        return null;
    }
    try {
        // 인터셉터가 붙은 apiClient로 보내면 재발급 실패(401)가 다시 재발급을 부르므로 기본 axios로 보낸다.
        const { data } = await axios.post<ApiResponse<TokenPair>>(
            `${BASE_URL}/auth/reissue`,
            { refreshToken },
            { timeout: TIMEOUT_MS },
        );
        if (!data.isSuccess) {
            return null;
        }
        await tokenStorage.setTokens(data.result.accessToken, data.result.refreshToken);
        return data.result.accessToken;
    } catch {
        return null;
    }
}

function reissueOnce() {
    reissuePromise ??= reissueAccessToken().finally(() => {
        reissuePromise = null;
    });
    return reissuePromise;
}

type RetryableConfig = AxiosRequestConfig & { _retried?: boolean };

/** 로그인·가입·재발급처럼 토큰 없이 부르는 경로는 401이어도 재발급하지 않는다. (로그인 401은 비밀번호 오류) */
function isAuthPath(url: string | undefined) {
    return url?.startsWith('/auth/') ?? false;
}

apiClient.interceptors.response.use(undefined, async (error: unknown) => {
    if (!(error instanceof AxiosError) || error.response?.status !== 401) {
        throw error;
    }
    const config = error.config as RetryableConfig | undefined;
    if (!config || config._retried || isAuthPath(config.url)) {
        throw error;
    }

    const accessToken = await reissueOnce();
    if (!accessToken) {
        handleSessionExpired?.();
        throw error;
    }

    config._retried = true;
    config.headers = { ...config.headers, Authorization: `Bearer ${accessToken}` };
    return apiClient.request(config);
});

/**
 * 공통 래퍼를 벗겨 `result`만 반환하고, 실패는 ApiError로 통일한다.
 * 각 feature의 api/ 요청 함수에서 이 함수를 사용한다.
 */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
        const { data, status } = await apiClient.request<ApiResponse<T>>(config);
        if (!data.isSuccess) {
            throw new ApiError(data.code, data.message, status);
        }
        return data.result;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        if (error instanceof AxiosError) {
            const { response } = error;
            // 서버 응답 자체가 없는 경우만 네트워크 오류로 분류한다.
            if (!response) {
                throw new ApiError(NETWORK_ERROR_CODE, '네트워크 연결을 확인해 주세요.');
            }
            const body = response.data as Partial<ApiResponse<unknown>> | undefined;
            throw new ApiError(
                body?.code ?? HTTP_ERROR_CODE,
                body?.message ?? '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
                response.status,
            );
        }
        throw error;
    }
}
