import { useMutation } from '@tanstack/react-query';

import { verifyEmail } from '@/features/auth/api/authApi';

/** 인증번호 확인. 받은 토큰은 가입을 마칠 때까지 signUpStore에 둔다. */
export function useVerifyEmailMutation() {
    return useMutation({ mutationFn: verifyEmail });
}
