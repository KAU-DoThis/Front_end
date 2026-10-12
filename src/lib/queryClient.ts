import { QueryClient } from '@tanstack/react-query';

import { ApiError, NETWORK_ERROR_CODE } from '@/shared/types/api';

/**
 * 네트워크 오류와 서버 오류(5xx)만 재시도한다.
 * 4xx와 비즈니스 오류(isSuccess: false)는 재시도해도 결과가 같으므로 바로 실패 처리한다.
 */
function isRetryableError(error: Error) {
    if (!(error instanceof ApiError)) {
        return true;
    }
    if (error.status !== undefined) {
        return error.status >= 500;
    }
    return error.code === NETWORK_ERROR_CODE;
}

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            retry: (failureCount, error) => isRetryableError(error) && failureCount < 2,
        },
    },
});
