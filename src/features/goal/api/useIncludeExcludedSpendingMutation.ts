import { useMutation, useMutationState, useQueryClient } from '@tanstack/react-query';

import { invalidateSavingData } from './invalidateSavingData';
import { includeExcludedSpending } from './savingApi';
import { savingKeys } from './savingKeys';

const includeMutationKey = [...savingKeys.all, 'include'] as const;

/** 후보에서 뺀 지출 다시 포함 — 후보가 다시 계산되므로 절약 데이터를 다시 받는다. */
export function useIncludeExcludedSpendingMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: includeMutationKey,
        mutationFn: includeExcludedSpending,
        // 다시 받기가 끝날 때까지 기다려서, 줄이 사라지기 전에 버튼이 다시 눌리지 않게 한다.
        onSuccess: () => invalidateSavingData(queryClient),
    });
}

/** 다시 포함을 보내는 중인 거래 id들 (여러 줄을 연달아 눌러도 모두 잡는다) */
export function useIncludingTransactionIds() {
    const pending = useMutationState({
        filters: { mutationKey: includeMutationKey, status: 'pending' },
        select: (mutation) => mutation.state.variables as number[],
    });
    return pending.flat();
}
