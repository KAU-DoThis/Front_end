import type { LoginRequest, LoginResponse } from '@/features/auth/types/auth';
import { AUTH_ERROR_CODE } from '@/features/auth/types/auth';
import { request } from '@/lib/apiClient';
import { ApiError } from '@/shared/types/api';

/**
 * 개발 빌드 전용 목업 계정. 백엔드 없이 로그인 이후 화면을 확인할 때 쓴다.
 * TODO: 로그인 API가 붙으면 제거한다.
 */
export const DEV_MOCK_ACCOUNT = {
    // 실제 사용자와 겹치지 않도록 예약된 도메인(example.com)을 쓴다.
    email: 'test@example.com',
    password: 'test1234',
} as const;

function mockLogin(body: LoginRequest): Promise<LoginResponse> {
    return new Promise((resolve, reject) => {
        // 로딩 상태도 확인할 수 있게 약간 지연한다.
        setTimeout(() => {
            if (
                body.email === DEV_MOCK_ACCOUNT.email &&
                body.password === DEV_MOCK_ACCOUNT.password
            ) {
                resolve({
                    accessToken: 'dev-mock-access-token',
                    refreshToken: 'dev-mock-refresh-token',
                    hasLinkedAccount: true,
                });
            } else {
                reject(
                    new ApiError(
                        AUTH_ERROR_CODE.INVALID_CREDENTIALS,
                        '이메일 또는 비밀번호가 일치하지 않습니다.',
                        401,
                    ),
                );
            }
        }, 500);
    });
}

export const login = (body: LoginRequest) => {
    if (__DEV__ && body.email === DEV_MOCK_ACCOUNT.email) {
        return mockLogin(body);
    }
    return request<LoginResponse>({ method: 'POST', url: '/auth/login', data: body });
};
