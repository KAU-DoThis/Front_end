import type {
    AgreementType,
    ConsentItemListResponse,
    ConsentSaveRequest,
    ConsentSaveResponse,
    LoginRequest,
    LoginResponse,
    SendVerificationCodeRequest,
    SignUpRequest,
    SignUpResponse,
    UserSettings,
    UserSettingsUpdateRequest,
    VerifyEmailRequest,
    VerifyEmailResponse,
} from '@/features/auth/types/auth';
import { AUTH_ERROR_CODE } from '@/features/auth/types/auth';
import { request } from '@/lib/apiClient';
import { USE_MOCK } from '@/lib/mock';
import { tokenStorage } from '@/lib/tokenStorage';
import { ApiError } from '@/shared/types/api';

/**
 * 목업 모드(USE_MOCK) 전용 목업 계정. 백엔드 없이 로그인 이후 화면을 확인할 때 쓴다.
 * TODO: 로그인 API가 붙으면 제거한다.
 */
export const DEV_MOCK_ACCOUNT = {
    // 실제 사용자와 겹치지 않도록 예약된 도메인(example.com)을 쓴다.
    email: 'test@example.com',
    password: 'test1234',
} as const;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

/**
 * 목업 모드에서 목업으로 가입한 계정 (이메일 → 비밀번호).
 * 가입한 계정으로 다시 로그인하는 흐름을 확인할 수 있게 메모리에만 둔다. 앱을 끄면 사라진다.
 */
const devSignedUpAccounts = new Map<string, string>();

/** 목업 로그인·가입이 주는 액세스 토큰. 저장된 토큰이 이 값이면 목업 세션이다. */
const DEV_MOCK_ACCESS_TOKEN = 'dev-mock-access-token';

/** 지금 세션이 목업 로그인인지. 앱을 다시 켜도 알 수 있게 저장된 토큰으로 판단한다. */
async function isMockSession() {
    return USE_MOCK && (await tokenStorage.getAccessToken()) === DEV_MOCK_ACCESS_TOKEN;
}

/**
 * 목업 모드 전용 온보딩 상태. 목업으로 가입한 계정은 온보딩을 마칠 때까지 LINK 단계다.
 * 메모리에만 두므로 앱을 끄면 사라지고, 그때는 온보딩을 마친 것으로 본다.
 */
const devOnboardingPendingEmails = new Set<string>();
/** 지금 목업으로 로그인한 계정. 앱을 다시 켜면 null이 되고, 그때는 온보딩을 마친 것으로 본다. */
let devMockCurrentEmail: string | null = null;

/** 목업 모드에서 블록 구성까지 마치면 부른다. */
export function completeMockOnboarding() {
    if (devMockCurrentEmail) {
        devOnboardingPendingEmails.delete(devMockCurrentEmail);
    }
}

function mockUserSettings(): UserSettings {
    const isPending =
        devMockCurrentEmail !== null && devOnboardingPendingEmails.has(devMockCurrentEmail);
    return {
        onboardingStep: isPending ? 'LINK' : 'DONE',
        hasLinkedAccount: !isPending,
        tutorialDone: !isPending,
        blocksConfirmed: !isPending,
        nickname: null,
        plan: 'FREE',
    };
}

/** 목업으로 로그인할 이메일인지 (목업 계정이거나 목업으로 가입한 계정) */
const isMockLoginEmail = (email: string) => {
    const normalized = normalizeEmail(email);
    return normalized === DEV_MOCK_ACCOUNT.email || devSignedUpAccounts.has(normalized);
};

function mockLogin(body: LoginRequest): Promise<LoginResponse> {
    return new Promise((resolve, reject) => {
        // 로딩 상태도 확인할 수 있게 약간 지연한다.
        setTimeout(() => {
            const email = normalizeEmail(body.email);
            const expectedPassword =
                email === DEV_MOCK_ACCOUNT.email
                    ? DEV_MOCK_ACCOUNT.password
                    : devSignedUpAccounts.get(email);
            if (expectedPassword !== undefined && body.password === expectedPassword) {
                devMockCurrentEmail = email;
                resolve({
                    accessToken: DEV_MOCK_ACCESS_TOKEN,
                    refreshToken: 'dev-mock-refresh-token',
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
    if (USE_MOCK && isMockLoginEmail(body.email)) {
        return mockLogin(body);
    }
    return request<LoginResponse>({ method: 'POST', url: '/auth/login', data: body });
};

/** 로그아웃. 서버의 리프레시 토큰을 폐기한다. */
export const logout = (refreshToken: string) =>
    request<null>({ method: 'POST', url: '/auth/logout', data: { refreshToken } });

/** 목업 모드(USE_MOCK)에서는 가입·약관 동의 저장도 목업으로 처리한다. */
const USE_SIGN_UP_MOCK = USE_MOCK;

/**
 * 이메일 인증 API가 아직 서버에 없어서, 목업 모드가 아니어도 인증번호 발송·확인은 항상 목업으로 처리한다.
 * TODO: 이메일 인증 API가 붙으면 USE_SIGN_UP_MOCK을 따르게 바꾸고 목업을 지운다.
 */
const USE_EMAIL_VERIFY_MOCK = true;

/** 목업 인증 코드. 이 코드를 넣으면 인증에 성공한다. */
export const DEV_MOCK_VERIFICATION_CODE = '123456';

/** 로딩 상태도 확인할 수 있게 약간 지연한다. */
function delay<T>(run: () => T): Promise<T> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                resolve(run());
            } catch (error) {
                reject(error);
            }
        }, 500);
    });
}

/**
 * 회원가입·이메일 인증 목업. 실제 메일은 보내지 않고, 인증번호는 DEV_MOCK_VERIFICATION_CODE다.
 * 목업 계정(test@example.com)과 목업으로 가입한 이메일은 이미 가입된 이메일로 응답해 중복 오류를 확인할 수 있다.
 * 실제 API로 가입할 때 다른 이메일의 중복 여부는 가입 요청(AUTH_EMAIL_DUPLICATED)에서 알 수 있다.
 * TODO: 이메일 인증 API가 붙으면 제거한다.
 */
function mockSendVerificationCode(body: SendVerificationCodeRequest) {
    return delay<null>(() => {
        if (isMockLoginEmail(body.email)) {
            throw new ApiError(
                AUTH_ERROR_CODE.EMAIL_ALREADY_EXISTS,
                '이미 가입된 이메일입니다.',
                409,
            );
        }
        return null;
    });
}

function mockVerifyEmail(body: VerifyEmailRequest) {
    return delay<VerifyEmailResponse>(() => {
        if (body.code !== DEV_MOCK_VERIFICATION_CODE) {
            throw new ApiError(
                AUTH_ERROR_CODE.INVALID_VERIFICATION_CODE,
                '인증 코드가 일치하지 않습니다.',
                400,
            );
        }
        return {
            accessToken: DEV_MOCK_ACCESS_TOKEN,
            refreshToken: 'dev-mock-refresh-token',
            email: body.email,
        };
    });
}

// TODO: 이메일 인증 URL이 명세에 나오면 맞춘다. (지금은 가정값)
/** 인증번호 메일 발송. 이미 가입된 이메일이면 EMAIL_ALREADY_EXISTS로 실패한다. */
export const sendVerificationCode = (body: SendVerificationCodeRequest) => {
    if (USE_EMAIL_VERIFY_MOCK) {
        return mockSendVerificationCode(body);
    }
    return request<null>({ method: 'POST', url: '/auth/email/send', data: body });
};

/** 인증번호 확인. 성공하면 토큰을 준다. */
export const verifyEmail = (body: VerifyEmailRequest) => {
    if (USE_EMAIL_VERIFY_MOCK) {
        return mockVerifyEmail(body);
    }
    return request<VerifyEmailResponse>({ method: 'POST', url: '/auth/email/verify', data: body });
};

/** 가입 요청. 이메일 인증을 마친 뒤에 보낸다. 이미 가입된 이메일이면 AUTH_EMAIL_DUPLICATED(409)로 실패한다. */
export const signUp = (body: SignUpRequest) => {
    if (USE_SIGN_UP_MOCK) {
        return delay<SignUpResponse>(() => {
            // 로그아웃 뒤 같은 이메일·비밀번호로 다시 로그인할 수 있게 기억해 둔다.
            const email = normalizeEmail(body.email);
            devSignedUpAccounts.set(email, body.password);
            devOnboardingPendingEmails.add(email);
            devMockCurrentEmail = email;
            return {
                accessToken: DEV_MOCK_ACCESS_TOKEN,
                refreshToken: 'dev-mock-refresh-token',
            };
        });
    }
    return request<SignUpResponse>({ method: 'POST', url: '/auth/signup', data: body });
};

/** 동의 항목 목록 (로그인 없이 열림) */
export const getConsentItems = () =>
    request<ConsentItemListResponse>({ method: 'GET', url: '/consents/items' });

/**
 * 동의 저장. accessToken을 주면 저장된 토큰 대신 이 토큰으로 보낸다.
 * (가입 직후에는 로그인 상태로 바꾸기 전에 저장해야 해서, 가입 응답 토큰을 직접 넘긴다)
 */
export const saveConsents = (body: ConsentSaveRequest, accessToken?: string) =>
    request<ConsentSaveResponse>({
        method: 'POST',
        url: '/users/me/consents',
        data: body,
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });

/** 가입 직후 약관 동의 저장. 문서 버전은 서버가 내려준 값을 그대로 쓴다. */
export async function saveSignUpConsents(
    agreements: Record<AgreementType, boolean>,
    accessToken: string,
): Promise<ConsentSaveResponse> {
    if (USE_SIGN_UP_MOCK) {
        return delay(() => ({ onboardingStep: 'LINK' }));
    }
    const { items } = await getConsentItems();
    return saveConsents(
        {
            consents: items.map(({ item, docVersion }) => ({
                item,
                agreed: agreements[item] ?? false,
                docVersion,
            })),
        },
        accessToken,
    );
}

/** 온보딩 상태. 목업으로 로그인했으면 목업 상태를 준다. */
export const getUserSettings = async () => {
    if (await isMockSession()) {
        return delay(mockUserSettings);
    }
    return request<UserSettings>({ method: 'GET', url: '/users/me/settings' });
};

/** 온보딩 상태 수정 (튜토리얼 완료 등). 바뀐 상태를 돌려준다. */
export const updateUserSettings = async (body: UserSettingsUpdateRequest) => {
    if (await isMockSession()) {
        return delay(mockUserSettings);
    }
    return request<UserSettings>({ method: 'PATCH', url: '/users/me/settings', data: body });
};
