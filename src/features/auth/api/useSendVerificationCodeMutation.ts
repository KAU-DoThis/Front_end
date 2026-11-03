import { useMutation } from '@tanstack/react-query';

import { sendVerificationCode } from '@/features/auth/api/authApi';

/** 인증번호 발송 (다시 받기도 같은 훅) */
export function useSendVerificationCodeMutation() {
    return useMutation({ mutationFn: sendVerificationCode });
}
