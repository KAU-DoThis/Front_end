import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '@/shared/types/api';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            retry: (failureCount, error) => {
                // 4xx는 재시도해도 결과가 같으므로 바로 실패 처리
                if (error instanceof ApiError && error.status && error.status < 500) {
                    return false;
                }
                return failureCount < 2;
            },
        },
    },
});
