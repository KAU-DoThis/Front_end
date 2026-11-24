import { useMutation, useQueryClient } from '@tanstack/react-query';

import { transactionKeys } from '@/features/transaction/api/transactionKeys';

import { deleteBlock } from './blockApi';
import { blockKeys } from './blockKeys';

/**
 * 블록 삭제 — 홈·블록 목록·나눌 돈과, 그 블록이 붙어 있던 거래 목록을 다시 받는다.
 * 지운 블록 상세는 다시 받으면 404라 빼고, 화면이 홈으로 돌아가면 버려진다.
 */
export function useDeleteBlockMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteBlock,
        onSuccess: (_result, blockId) =>
            Promise.all([
                queryClient.invalidateQueries({
                    queryKey: blockKeys.all,
                    predicate: (query) => query.queryKey[1] !== blockId,
                }),
                queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
            ]),
    });
}
