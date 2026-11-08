import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createSetupBlocks } from './blockApi';
import { blockKeys } from './blockKeys';

/** 온보딩 블록 구성 확정. 만든 블록이 홈에 바로 보이도록 홈 데이터를 갱신한다. */
export function useCreateSetupBlocksMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createSetupBlocks,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: blockKeys.home() }),
    });
}
