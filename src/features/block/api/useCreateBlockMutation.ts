import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createBlock } from './blockApi';
import { blockKeys } from './blockKeys';

/** 블록 추가 — 홈·블록 목록을 다시 받아 새 블록이 바로 보이게 한다. */
export function useCreateBlockMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createBlock,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: blockKeys.all }),
    });
}
