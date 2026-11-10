export interface LoginRequest {
    email: string;
    password: string;
}

/** 백엔드 TokenResponse */
export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
}

/** 동의 항목 (Back_end ConsentItem) */
export type AgreementType = 'TERMS' | 'PRIVACY' | 'CODEF' | 'AGE_14' | 'MARKETING';

/** 가입 요청. 약관 동의는 가입 후 POST /users/me/consents로 따로 저장한다. */
export interface SignUpRequest {
    email: string;
    password: string;
}

/** 동의 항목 (Back_end ConsentItemResponse) */
export interface ConsentItemResponse {
    item: AgreementType;
    title: string;
    description: string | null;
    required: boolean;
    /** 동의 문서 버전. 저장할 때 이 값을 그대로 보낸다. (서버 최신 버전과 다르면 거절) */
    docVersion: string;
    docUrl: string | null;
}

/** GET /consents/items */
export interface ConsentItemListResponse {
    items: ConsentItemResponse[];
    /** 동의 화면 하단 안내 문구 */
    notice: string;
}

/** POST /users/me/consents */
export interface ConsentSaveRequest {
    consents: { item: AgreementType; agreed: boolean; docVersion: string }[];
}

/** 온보딩 단계. 앱 시작 시 이 단계 화면으로 보낸다. (Back_end OnboardingStep) */
export type OnboardingStep = 'CONSENT' | 'LINK' | 'TUTORIAL' | 'BLOCKS' | 'DONE';

export interface ConsentSaveResponse {
    /** 저장 후 온보딩 단계 */
    onboardingStep: OnboardingStep;
}

/** GET /users/me/settings (Back_end UserSettingResponse) */
export interface UserSettings {
    /** CONSENT → LINK → TUTORIAL → BLOCKS → DONE */
    onboardingStep: OnboardingStep;
    hasLinkedAccount: boolean;
    tutorialDone: boolean;
    /** 초기 블록 확정 여부. 초기 블록 확정 API가 바꾼다. */
    blocksConfirmed: boolean;
    nickname: string | null;
    plan: 'FREE' | 'PREMIUM';
}

/** PATCH /users/me/settings — 바꿀 필드만 보낸다. */
export interface UserSettingsUpdateRequest {
    tutorialDone?: boolean;
    nickname?: string;
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
    EMAIL_ALREADY_EXISTS: 'AUTH_EMAIL_DUPLICATED',
    // TODO: 이메일 인증 에러 코드가 명세에 나오면 맞춘다. (지금은 가정값)
    INVALID_VERIFICATION_CODE: 'AUTH_400',
    VERIFICATION_CODE_EXPIRED: 'AUTH_410',
} as const;
