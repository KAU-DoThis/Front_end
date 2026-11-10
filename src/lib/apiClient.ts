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
 * 재발급 결과
 * - ok: 새 토큰을 저장했다.
 * - failed: 재발급하지 못했다. (토큰이 없거나, 읽지 못했거나, 서버가 거절함) → 세션 만료
 * - stale: 재발급하는 사이 로그아웃·다른 계정 로그인으로 저장된 토큰이 바뀌었다. → 결과를 버린다.
 * - network: 서버 응답을 받지 못했거나 서버 오류(5xx)다. → 로그인은 유지하고 원래 요청만 실패시킨다.
 */
type ReissueResult =
    | { status: 'ok'; accessToken: string }
    | { status: 'failed' }
    | { status: 'stale' }
    | { status: 'network' };

/**
 * 리프레시 토큰은 한 번만 쓸 수 있어서, 여러 요청이 동시에 401을 받아도 재발급은 한 번만 보낸다.
 * 진행 중인 재발급이 있으면 그 결과를 같이 기다린다.
 */
let reissuePromise: Promise<ReissueResult> | null = null;

/**
 * 로그아웃·세션 만료로 토큰을 지우는 작업 수. 0보다 크면 재발급을 시작하지 않고 결과도 저장하지 않는다.
 * (동시에 401이 여러 번 와서 세션 만료가 겹쳐도, 먼저 끝난 쪽이 표시를 풀지 않도록 개수로 센다)
 */
let closingSessionCount = 0;
const isClosingSession = () => closingSessionCount > 0;

async function reissueAccessToken(): Promise<ReissueResult> {
    if (isClosingSession()) {
        return { status: 'stale' };
    }
    try {
        const refreshToken = await tokenStorage.getRefreshToken();
        if (!refreshToken) {
            return { status: 'failed' };
        }
        // 인터셉터가 붙은 apiClient로 보내면 재발급 실패(401)가 다시 재발급을 부르므로 기본 axios로 보낸다.
        const { data } = await axios.post<ApiResponse<TokenPair>>(
            `${BASE_URL}/auth/reissue`,
            { refreshToken },
            { timeout: TIMEOUT_MS },
        );
        // 응답을 기다리는 사이 로그아웃·세션 만료가 시작됐거나 토큰이 바뀌었으면 저장하지 않는다.
        if (isClosingSession() || (await tokenStorage.getRefreshToken()) !== refreshToken) {
            return { status: 'stale' };
        }
        if (!data.isSuccess) {
            return { status: 'failed' };
        }
        await tokenStorage.setTokens(data.result.accessToken, data.result.refreshToken);
        return { status: 'ok', accessToken: data.result.accessToken };
    } catch (error) {
        // 토큰이 잘못된 게 아니라 잠깐 연결이 안 된 경우라 로그아웃시키지 않는다.
        if (error instanceof AxiosError && (!error.response || error.response.status >= 500)) {
            return { status: 'network' };
        }
        return { status: 'failed' };
    }
}

function reissueOnce() {
    reissuePromise ??= reissueAccessToken().finally(() => {
        reissuePromise = null;
    });
    return reissuePromise;
}

/**
 * 로그아웃·세션 만료 때 토큰을 지우는 작업(close)을 재발급과 겹치지 않게 실행한다.
 * - 새 재발급은 시작하지 않고, 진행 중인 재발급의 결과는 저장하지 않는다.
 * - 진행 중인 재발급이 끝난 뒤에 close를 실행한다. (끝나지 않은 재발급이 지운 토큰을 다시 저장하지 않게)
 * 버린 재발급 토큰은 앱 어디에도 저장되지 않아 다시 쓸 수 없다.
 */
export async function closeSession(close: () => Promise<void>) {
    closingSessionCount += 1;
    try {
        await reissuePromise;
        await close();
    } finally {
        closingSessionCount -= 1;
    }
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
    if (!config || isAuthPath(config.url)) {
        throw error;
    }
    // 새 토큰으로 다시 보냈는데도 401이면 인증 자체가 실패한 것이다. (권한 오류는 서버가 403으로 준다)
    if (config._retried) {
        handleSessionExpired?.();
        throw error;
    }

    const result = await reissueOnce();
    if (result.status === 'stale' || result.status === 'network') {
        throw error;
    }
    if (result.status === 'failed') {
        handleSessionExpired?.();
        throw error;
    }

    config._retried = true;
    config.headers = { ...config.headers, Authorization: `Bearer ${result.accessToken}` };
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
