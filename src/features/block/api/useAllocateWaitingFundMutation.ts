import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { AllocationRequest } from '@/features/block/types/waitingFund';

import { allocateWaitingFund } from './blockApi';
import { blockKeys } from './blockKeys';

interface AllocateWaitingFundParams {
    waitingFundId: number;
    body: AllocationRequest;
}

/** 나눌 돈 배분 확정 — 성공하면 홈·상세·나눌 돈 목록을 모두 다시 받는다. */
export function useAllocateWaitingFundMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ waitingFundId, body }: AllocateWaitingFundParams) =>
            allocateWaitingFund(waitingFundId, body),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: blockKeys.all }),
    });
}
