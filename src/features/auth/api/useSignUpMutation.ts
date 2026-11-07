import { useMutation } from '@tanstack/react-query';

import { signUp } from '@/features/auth/api/authApi';

/** 가입 요청. 로그인 처리는 화면에서 이메일 인증 때 받은 토큰으로 한다. */
export function useSignUpMutation() {
    return useMutation({ mutationFn: signUp });
}
