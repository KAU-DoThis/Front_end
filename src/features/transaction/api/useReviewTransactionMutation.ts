import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteTransaction, keepTransaction } from './transactionApi';
import { transactionKeys } from './transactionKeys';

/** 카드 내역에 없는 직접 넣은 거래: 유지(KEEP) 또는 삭제(DELETE). 합계가 바뀌므로 거래 데이터를 다시 받는다. */
export function useReviewTransactionMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            transactionId,
            action,
        }: {
            transactionId: number;
            action: 'KEEP' | 'DELETE';
        }) =>
            action === 'KEEP' ? keepTransaction(transactionId) : deleteTransaction(transactionId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
    });
}
