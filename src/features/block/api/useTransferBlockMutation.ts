import { useMutation, useQueryClient } from '@tanstack/react-query';

import { transferBlock } from './blockApi';
import { blockKeys } from './blockKeys';

/** 블록 간 이동 확정 — 성공하면 홈·상세·미리보기를 모두 다시 받는다. */
export function useTransferBlockMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: transferBlock,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: blockKeys.all }),
    });
}
