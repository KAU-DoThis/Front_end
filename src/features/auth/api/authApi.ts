import type {
    LoginRequest,
    LoginResponse,
    SendVerificationCodeRequest,
    SignUpRequest,
    SignUpResponse,
    VerifyEmailRequest,
    VerifyEmailResponse,
} from '@/features/auth/types/auth';
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

/**
 * 회원가입·이메일 인증 API가 아직 없어서, 개발 빌드에서는 이메일과 상관없이 모두 목업으로 처리한다.
 * TODO: 회원가입·이메일 인증 API가 붙으면 목업과 함께 제거한다.
 */
const USE_SIGN_UP_MOCK = __DEV__;

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
 * 개발 빌드 전용 회원가입·이메일 인증 목업. 실제 메일은 보내지 않고, 인증번호는 DEV_MOCK_VERIFICATION_CODE다.
 * 목업 계정(test@example.com)은 이미 가입된 이메일로 응답해 중복 오류를 확인할 수 있다.
 * TODO: 회원가입·이메일 인증 API가 붙으면 제거한다.
 */
function mockSendVerificationCode(body: SendVerificationCodeRequest) {
    return delay<null>(() => {
        if (body.email === DEV_MOCK_ACCOUNT.email) {
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
            accessToken: 'dev-mock-access-token',
            refreshToken: 'dev-mock-refresh-token',
            email: body.email,
        };
    });
}

// TODO: 회원가입·이메일 인증 URL이 명세에 나오면 맞춘다. (지금은 가정값)
/** 인증번호 메일 발송. 이미 가입된 이메일이면 EMAIL_ALREADY_EXISTS로 실패한다. */
export const sendVerificationCode = (body: SendVerificationCodeRequest) => {
    if (USE_SIGN_UP_MOCK) {
        return mockSendVerificationCode(body);
    }
    return request<null>({ method: 'POST', url: '/auth/email/send', data: body });
};

/** 인증번호 확인. 성공하면 토큰을 준다. */
export const verifyEmail = (body: VerifyEmailRequest) => {
    if (USE_SIGN_UP_MOCK) {
        return mockVerifyEmail(body);
    }
    return request<VerifyEmailResponse>({ method: 'POST', url: '/auth/email/verify', data: body });
};

/** 가입 요청. 이메일 인증을 마친 뒤에 보낸다. */
export const signUp = (body: SignUpRequest) => {
    if (USE_SIGN_UP_MOCK) {
        return delay<SignUpResponse>(() => ({
            accessToken: 'dev-mock-access-token',
            refreshToken: 'dev-mock-refresh-token',
        }));
    }
    return request<SignUpResponse>({ method: 'POST', url: '/auth/signup', data: body });
};
