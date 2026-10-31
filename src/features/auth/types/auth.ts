// TODO: 로그인 API 명세가 나오면 요청·응답 필드와 에러 코드를 맞춘다. (지금은 가정값)
export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    /** 금융기관 계좌를 연결했는지 (안 했으면 온보딩으로 보낸다) */
    hasLinkedAccount: boolean;
}

export const AUTH_ERROR_CODE = {
    INVALID_CREDENTIALS: 'AUTH_401',
} as const;
