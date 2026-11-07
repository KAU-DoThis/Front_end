export interface LoginRequest {
    email: string;
    password: string;
}

/** 백엔드 TokenResponse */
export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
}

/** 회원가입 약관 종류 */
// TODO: 약관 종류 값이 명세에 나오면 맞춘다. (지금은 가정값)
export type AgreementType =
    'TERMS_OF_SERVICE' | 'PRIVACY_POLICY' | 'FINANCIAL_INFO_INQUIRY' | 'AGE_OVER_14' | 'MARKETING';

export interface Agreement {
    type: AgreementType;
    isAgreed: boolean;
}

export interface SignUpRequest {
    email: string;
    password: string;
    /** 모든 약관을 동의 여부와 함께 보낸다. (선택 약관도 미동의면 false로 보낸다) */
    agreements: Agreement[];
}

/** 백엔드 가입 응답 (TokenResponse). 이 토큰으로 로그인한다. */
export type SignUpResponse = LoginResponse;

// TODO: 인증번호 발송·확인 요청 필드가 명세에 나오면 맞춘다. (지금은 가정값)
/** 인증번호 발송 (다시 보낼 때도 같은 요청). 이전 인증번호는 더 이상 쓸 수 없다. */
export interface SendVerificationCodeRequest {
    email: string;
}

export interface VerifyEmailRequest {
    email: string;
    code: string;
}

/** 인증이 끝나면 토큰을 준다. (API 명세 응답 예시 기준) 로그인은 가입 응답 토큰으로 한다. */
export interface VerifyEmailResponse {
    accessToken: string;
    refreshToken: string;
    email: string;
}

/** 백엔드 AuthErrorCode */
export const AUTH_ERROR_CODE = {
    INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
    /** 로그인 5회 실패 시 10분 동안 잠긴다. */
    ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',
    // TODO: 회원가입·이메일 인증 에러 코드가 명세에 나오면 맞춘다. (지금은 가정값)
    EMAIL_ALREADY_EXISTS: 'AUTH_409',
    INVALID_VERIFICATION_CODE: 'AUTH_400',
    VERIFICATION_CODE_EXPIRED: 'AUTH_410',
} as const;
