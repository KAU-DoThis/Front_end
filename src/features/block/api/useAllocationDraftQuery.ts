import { useQuery } from '@tanstack/react-query';

import { getAllocationDraft } from './blockApi';
import { blockKeys } from './blockKeys';

/** 배분하기(06) 초기값. 화면에 들어올 때마다 새로 받는다. (그사이 잔액이 바뀌었을 수 있어서) */
export function useAllocationDraftQuery(waitingFundId: number) {
    return useQuery({
        queryKey: blockKeys.allocationDraft(waitingFundId),
        queryFn: () => getAllocationDraft(waitingFundId),
        enabled: Number.isInteger(waitingFundId) && waitingFundId > 0,
        staleTime: 0,
        gcTime: 0,
    });
}
