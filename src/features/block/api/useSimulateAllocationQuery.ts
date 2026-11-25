import { useQuery } from '@tanstack/react-query';

import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';

import { simulateTransfer } from './blockApi';
import { blockKeys } from './blockKeys';

/** 금액을 바꿀 때마다 300ms 쉬었다가 다시 계산한다. (Figma 카드 공통 컴포넌트 보드 규칙) */
const SIMULATE_DEBOUNCE_MS = 300;

interface SimulateAllocationParams {
    waitingFundId: number;
    /** [blockId, 금액] 목록. 금액이 0보다 큰 것만 넣는다. */
    amounts: [number, number][];
}

/**
 * 06 배분 미리보기 (POST /blocks/simulate, fromWaitingFundId)
 * 넣을 금액이 하나도 없으면 요청하지 않는다. 다시 계산하는 동안에는 이전 결과를 그대로 보여준다.
 */
export function useSimulateAllocationQuery({ waitingFundId, amounts }: SimulateAllocationParams) {
    // 배열은 매번 새로 만들어지므로 문자열로 바꿔서 바뀐 걸 알아챈다.
    const amountsKey = JSON.stringify(amounts);
    const debouncedKey = useDebouncedValue(amountsKey, SIMULATE_DEBOUNCE_MS);
    const debouncedAmounts = JSON.parse(debouncedKey) as [number, number][];

    const query = useQuery({
        queryKey: blockKeys.simulateAllocation(waitingFundId, debouncedAmounts),
        queryFn: () =>
            simulateTransfer({
                changes: debouncedAmounts.map(([toBlockId, amount]) => ({
                    fromWaitingFundId: waitingFundId,
                    toBlockId,
                    amount,
                })),
            }),
        enabled: debouncedAmounts.length > 0,
        placeholderData: (previousData) => previousData,
        staleTime: 0,
    });

    return {
        ...query,
        /** 입력한 금액이 아직 계산에 반영되지 않음 (300ms 대기 또는 요청 중) */
        isStale: amountsKey !== debouncedKey || query.isFetching,
    };
}
