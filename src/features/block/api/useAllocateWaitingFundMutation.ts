import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { AllocationRequest } from '@/features/block/types/waitingFund';
import { savingKeys } from '@/features/goal/api/savingKeys';

import { allocateWaitingFund } from './blockApi';
import { blockKeys } from './blockKeys';

interface AllocateWaitingFundParams {
    waitingFundId: number;
    body: AllocationRequest;
}

/** 배분하기 화면이 쓰는 초기값·미리보기. 다 나누면 그 나눌 돈이 없어져서 다시 받으면 404가 난다. */
const isAllocationScreenQuery = (queryKey: readonly unknown[]) =>
    blockKeys.allocation().every((part, index) => queryKey[index] === part);

/**
 * 나눌 돈 배분 확정 — 성공하면 홈·상세·나눌 돈 목록을 모두 다시 받는다.
 * 절약분을 다 나누면 절약 탭 상단 배너도 사라져야 해서 절약 데이터도 다시 받는다.
 */
export function useAllocateWaitingFundMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ waitingFundId, body }: AllocateWaitingFundParams) =>
            allocateWaitingFund(waitingFundId, body),
        onSuccess: () =>
            Promise.all([
                queryClient.invalidateQueries({
                    queryKey: blockKeys.all,
                    predicate: (query) => !isAllocationScreenQuery(query.queryKey),
                }),
                queryClient.invalidateQueries({ queryKey: savingKeys.all }),
            ]),
    });
}
