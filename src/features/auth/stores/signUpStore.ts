import { create } from 'zustand';

import {
    INITIAL_AGREEMENT_STATE,
    type AgreementState,
} from '@/features/auth/components/AgreementList';
import type { SignUpResponse } from '@/features/auth/types/auth';

/**
 * 회원가입 단계(입력·이메일 인증 → 약관 동의) 사이에 넘기는 값.
 * 비밀번호와 토큰을 라우트 파라미터로 넘기지 않으려고 메모리에만 둔다.
 * 약관 화면을 나갔다 다시 들어와도 유지되고, 회원가입 화면이 사라질 때 reset()으로 비운다.
 */
interface SignUpState {
    /** 이메일 인증을 마친 이메일 */
    email: string;
    password: string;
    agreements: AgreementState;
    /** 가입 응답으로 받은 토큰. 있으면 가입이 끝난 것이라 다시 가입 요청을 보내지 않고 로그인만 한다. */
    signedUpTokens: SignUpResponse | null;
    setCredentials: (email: string, password: string) => void;
    setAgreements: (agreements: AgreementState) => void;
    setSignedUpTokens: (tokens: SignUpResponse) => void;
    reset: () => void;
}

const INITIAL_STATE = {
    email: '',
    password: '',
    agreements: INITIAL_AGREEMENT_STATE,
    signedUpTokens: null,
};

export const useSignUpStore = create<SignUpState>((set) => ({
    ...INITIAL_STATE,

    setCredentials(email, password) {
        set({ email, password });
    },

    setAgreements(agreements) {
        set({ agreements });
    },

    setSignedUpTokens(signedUpTokens) {
        set({ signedUpTokens });
    },

    reset() {
        set(INITIAL_STATE);
    },
}));
