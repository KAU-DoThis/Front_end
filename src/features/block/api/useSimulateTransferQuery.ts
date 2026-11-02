import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';

import { simulateTransfer } from './blockApi';
import { blockKeys } from './blockKeys';

/** 금액을 바꿀 때마다 300ms 쉬었다가 다시 계산한다. (Figma 카드 공통 컴포넌트 보드 규칙) */
const SIMULATE_DEBOUNCE_MS = 300;

interface SimulateTransferParams {
    fromBlockId: number | null;
    toBlockId: number | null;
    amount: number;
}

/**
 * 03-2 이동 전 검증
 * 보내는·받는 블록을 다 고르면 요청한다. 금액이 0이어도 요청해서 [부족한 만큼] 값(shortfall)을 먼저 받는다.
 * 다시 계산하는 동안에는 이전 결과를 그대로 보여준다. (목록이 깜빡이지 않도록)
 */
export function useSimulateTransferQuery({
    fromBlockId,
    toBlockId,
    amount,
}: SimulateTransferParams) {
    const debouncedAmount = useDebouncedValue(amount, SIMULATE_DEBOUNCE_MS);
    const enabled = fromBlockId !== null && toBlockId !== null && fromBlockId !== toBlockId;

    const query = useQuery({
        queryKey: blockKeys.simulate(fromBlockId ?? 0, toBlockId ?? 0, debouncedAmount),
        queryFn: () =>
            simulateTransfer({
                changes: [
                    {
                        fromBlockId: fromBlockId ?? 0,
                        toBlockId: toBlockId ?? 0,
                        amount: debouncedAmount,
                    },
                ],
            }),
        enabled,
        placeholderData: keepPreviousData,
        staleTime: 0,
    });

    return {
        ...query,
        /** 입력한 금액이 아직 계산에 반영되지 않음 (300ms 대기 또는 요청 중) */
        isStale: amount !== debouncedAmount || query.isFetching,
    };
}
