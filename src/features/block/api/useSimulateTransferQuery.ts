import { useQuery } from '@tanstack/react-query';

import { USE_MOCK } from '@/lib/mock';
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
 * 같은 블록 조합에서 금액만 바꿔 다시 계산하는 동안에는 이전 결과를 그대로 보여준다.
 */
export function useSimulateTransferQuery({
    fromBlockId,
    toBlockId,
    amount,
}: SimulateTransferParams) {
    const debouncedAmount = useDebouncedValue(amount, SIMULATE_DEBOUNCE_MS);
    // 서버는 금액이 1원 이상이어야 받는다(@Positive). 0원으로는 [부족한 만큼] 값을 먼저 받을 수 없어서,
    // 서버 모드에서는 금액을 넣은 뒤부터 요청한다.
    // TODO: 서버가 0원 미리보기를 받아 주면 이 조건을 지운다.
    const canRequestAmount = USE_MOCK || debouncedAmount > 0;
    const enabled =
        fromBlockId !== null && toBlockId !== null && fromBlockId !== toBlockId && canRequestAmount;

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
        // 금액만 바뀔 때는 이전 결과를 그대로 보여준다. (목록이 깜빡이지 않도록)
        // 블록 조합이 바뀌면 이전 결과는 다른 블록 이야기라 버린다.
        placeholderData: (previousData, previousQuery) => {
            // 서버 모드에서 금액을 지우면 요청하지 않으므로, 이전 금액의 결과도 보여주지 않는다.
            if (!canRequestAmount) {
                return undefined;
            }
            const [, , previousFrom, previousTo] = previousQuery?.queryKey ?? [];
            return previousFrom === fromBlockId && previousTo === toBlockId
                ? previousData
                : undefined;
        },
        staleTime: 0,
    });

    return {
        ...query,
        /** 입력한 금액이 아직 계산에 반영되지 않음 (300ms 대기 또는 요청 중) */
        isStale: amount !== debouncedAmount || query.isFetching,
    };
}
