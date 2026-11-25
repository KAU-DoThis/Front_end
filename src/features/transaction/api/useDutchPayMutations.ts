import { useMutation, useQueryClient } from '@tanstack/react-query';

import { blockKeys } from '@/features/block/api/blockKeys';

import { deleteDutchPay, saveDutchPay } from './dutchPayApi';
import { transactionKeys } from './transactionKeys';

/** 거래 목록·합계·더치페이와 블록 잔액(생활비 복구·나눌 돈)이 바뀌므로 둘 다 다시 받는다. */
function useInvalidateAfterDutchPay() {
    const queryClient = useQueryClient();
    return () =>
        Promise.all([
            queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
            queryClient.invalidateQueries({ queryKey: blockKeys.all }),
        ]);
}

/** 더치페이 만들기·수정 */
export function useSaveDutchPayMutation() {
    const invalidate = useInvalidateAfterDutchPay();
    return useMutation({ mutationFn: saveDutchPay, onSuccess: invalidate });
}

/** 더치페이 해제 */
export function useDeleteDutchPayMutation() {
    const invalidate = useInvalidateAfterDutchPay();
    return useMutation({ mutationFn: deleteDutchPay, onSuccess: invalidate });
}
