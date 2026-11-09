import { useMutation } from '@tanstack/react-query';

import { login } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/features/auth/stores/authStore';

/** 로그인 성공 시 토큰을 저장한 뒤 호출자의 onSuccess가 실행된다. */
export function useLoginMutation() {
    const saveTokens = useAuthStore((state) => state.login);

    return useMutation({
        mutationFn: login,
        // 온보딩을 마치지 않은 계정인지 이메일로 확인하므로 같이 넘긴다.
        onSuccess: ({ accessToken, refreshToken }, { email }) =>
            saveTokens(accessToken, refreshToken, { email }),
    });
}
