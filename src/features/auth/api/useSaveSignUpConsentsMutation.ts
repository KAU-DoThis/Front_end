import { useMutation } from '@tanstack/react-query';

import { saveSignUpConsents } from '@/features/auth/api/authApi';
import type { AgreementType } from '@/features/auth/types/auth';

interface SaveSignUpConsentsParams {
    agreements: Record<AgreementType, boolean>;
    /** 가입 응답으로 받은 토큰 (아직 로그인 상태로 바꾸기 전이라 직접 넘긴다) */
    accessToken: string;
}

/** 가입 직후 약관 동의 저장 */
export function useSaveSignUpConsentsMutation() {
    return useMutation({
        mutationFn: ({ agreements, accessToken }: SaveSignUpConsentsParams) =>
            saveSignUpConsents(agreements, accessToken),
    });
}
