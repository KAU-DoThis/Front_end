import { useMutation, useQueryClient } from '@tanstack/react-query';

import { blockKeys } from '@/features/block/api/blockKeys';

import { createQuickInput } from './transactionApi';
import { transactionKeys } from './transactionKeys';

/** 빠른 입력 저장 — 거래가 늘어나므로 거래 목록·소비 분석과 블록 잔액을 다시 받는다. */
export function useCreateQuickInputMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createQuickInput,
        onSuccess: () =>
            Promise.all([
                queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
                queryClient.invalidateQueries({ queryKey: blockKeys.all }),
            ]),
    });
}
