export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
}

export const AUTH_ERROR_CODE = {
    INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
    /** 로그인 5회 실패 시 10분 동안 잠긴다. */
    ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',
} as const;
