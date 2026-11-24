import type { QueryClient } from '@tanstack/react-query';

import { savingKeys } from './savingKeys';

/**
 * 절약 요약과 후보 목록을 다시 받는다.
 * goalDraft는 빼 둔다. 시트가 마지막 후보 id를 들고 있어서, 함께 다시 받으면
 * 이미 목표로 정했거나 뺀 후보의 초기값을 또 요청하게 된다.
 */
export const invalidateSavingData = (queryClient: QueryClient) =>
    Promise.all([
        queryClient.invalidateQueries({ queryKey: savingKeys.overview() }),
        queryClient.invalidateQueries({ queryKey: savingKeys.suggestions() }),
    ]);
