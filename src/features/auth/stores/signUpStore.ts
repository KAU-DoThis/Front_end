import { create } from 'zustand';

interface VerifiedTokens {
    accessToken: string;
    refreshToken: string;
}

/**
 * 회원가입 단계(입력·이메일 인증 → 약관 동의) 사이에 넘기는 값.
 * 비밀번호와 토큰을 라우트 파라미터로 넘기지 않으려고 메모리에만 둔다.
 */
interface SignUpState {
    email: string;
    password: string;
    /** 이메일 인증 때 받은 토큰. 가입을 마치면 이 토큰으로 로그인한다. */
    verifiedTokens: VerifiedTokens | null;
    setCredentials: (email: string, password: string, verifiedTokens: VerifiedTokens) => void;
    reset: () => void;
}

const INITIAL_STATE = { email: '', password: '', verifiedTokens: null };

export const useSignUpStore = create<SignUpState>((set) => ({
    ...INITIAL_STATE,

    setCredentials(email, password, verifiedTokens) {
        set({ email, password, verifiedTokens });
    },

    reset() {
        set(INITIAL_STATE);
    },
}));
