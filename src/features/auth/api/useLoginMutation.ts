import { useMutation } from '@tanstack/react-query';

import { login } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/features/auth/stores/authStore';

/** 로그인 성공 시 토큰을 저장한 뒤 호출자의 onSuccess가 실행된다. */
export function useLoginMutation() {
    const saveTokens = useAuthStore((state) => state.login);

    return useMutation({
        mutationFn: login,
        // 토큰을 저장하고 서버 온보딩 상태까지 받아야 로그인이 끝난다.
        onSuccess: ({ accessToken, refreshToken }) => saveTokens(accessToken, refreshToken),
    });
}
