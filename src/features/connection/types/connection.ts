/** 금융기관 종류 (linked_accounts.type과 같은 값) */
export type InstitutionType = 'BANK' | 'CARD';

/** 연결할 수 있는 금융기관 */
export interface Institution {
    type: InstitutionType;
    /** CODEF 기관 코드 (예: 0004 KB국민은행, 0301 KB국민카드) */
    code: string;
    /** 화면에 보여줄 짧은 이름 (예: KB국민) */
    name: string;
}

// TODO: 연동 API 명세가 나오면 맞춘다. (지금은 가정값)
/**
 * 기관 연결 요청. 여러 기관을 한 번에 보낸다.
 * 다른 은행 동시 연동·호출 제한은 아직 검증 전이라, 서버가 기관마다 결과를 따로 돌려준다고 가정한다.
 */
export interface ConnectInstitutionsRequest {
    institutions: { type: InstitutionType; institutionCode: string }[];
}

export type InstitutionConnectionStatus = 'CONNECTED' | 'FAILED';

/** 기관 하나의 연결 결과 */
export interface InstitutionConnectionResult {
    type: InstitutionType;
    institutionCode: string;
    status: InstitutionConnectionStatus;
    /** 실패 사유 코드 (성공이면 null) */
    errorCode: string | null;
    /** 기관이 돌려준 메시지 (예: 인증서 비밀번호가 맞지 않아요). 없으면 null */
    institutionMessage: string | null;
}

export interface ConnectInstitutionsResponse {
    results: InstitutionConnectionResult[];
}

// TODO: 연동 에러 코드가 명세에 나오면 맞춘다. (지금은 가정값)
/** 연동 에러 코드 */
export const CONNECTION_ERROR_CODE = {
    /** CODEF 호출 제한에 걸림 */
    RATE_LIMITED: 'CONNECTION_429',
    /** 아직 연결하지 않은 기관. 앱에 기관 인증 입력 화면이 없어 연결할 수 없다. */
    AUTH_INPUT_UNAVAILABLE: 'CONNECTION_AUTH_INPUT_UNAVAILABLE',
} as const;

/** 연동된 계좌·카드 한 건 (Back_end LinkedAccountResponse) */
export interface LinkedAccountResponse {
    linkedAccountId: number;
    institutionCode: string;
    institutionName: string;
    type: InstitutionType;
    accountName: string | null;
    accountNumberLast4: string | null;
    /** 카드는 null */
    balance: number | null;
    isActive: boolean;
    status: string;
    lastSyncedAt: string | null;
}

/** GET /linked-accounts (해제된 계좌는 빠진다) */
export interface LinkedAccountListResponse {
    totalBalance: number;
    lastSyncedAt: string | null;
    linkedAccounts: LinkedAccountResponse[];
}
