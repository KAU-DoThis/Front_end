import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createQuickInput } from './transactionApi';
import { transactionKeys } from './transactionKeys';

/** 빠른 입력 저장 — 거래가 늘어나므로 거래 목록과 소비 분석을 다시 받는다. */
export function useCreateQuickInputMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createQuickInput,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
    });
}
