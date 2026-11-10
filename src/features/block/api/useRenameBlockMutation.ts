import { useMutation, useQueryClient } from '@tanstack/react-query';

import { renameBlock } from './blockApi';
import { blockKeys } from './blockKeys';

/** 블록 이름 바꾸기 — 성공하면 홈·상세를 다시 받는다. */
export function useRenameBlockMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: renameBlock,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: blockKeys.all }),
    });
}
