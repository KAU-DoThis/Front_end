import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ApplyGoalOutcomeRequest } from '@/features/block/types/goalOutcome';
import {
    settleGoalOutcome,
    type GoalOutcomeTarget,
} from '@/features/block/utils/goalOutcomeDismissal';
import { transactionKeys } from '@/features/transaction/api/transactionKeys';

import { applyGoalOutcome } from './blockApi';
import { blockKeys } from './blockKeys';

interface ApplyGoalOutcomeParams {
    blockId: number;
    body: ApplyGoalOutcomeRequest;
    /** 끝낸 목표로 기록할 대상 (그대로 지키기 · 모은 만큼으로 끝내기). 상세를 다시 받기 전에 기록해야 시트가 또 뜨지 않는다. */
    settle?: GoalOutcomeTarget;
}

/**
 * 목표 달성(17) · 기한 지남(17-1) 처리 — 홈·상세·블록 목록·나눌 돈을 다시 받는다.
 * 지금은 괜찮아요(REMIND_LATER)는 바뀌는 게 없어서 다시 받지 않는다.
 * 블록 정리하기(CLEANUP)는 블록을 지우므로 블록 삭제처럼 상세(404)는 빼고 거래 목록도 다시 받는다.
 * 다 받을 때까지 기다리지 않는다. 바뀐 목표로 시트 내용이 먼저 바뀌지 않도록 시트를 바로 닫게 한다.
 */
export function useApplyGoalOutcomeMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ blockId, body, settle }: ApplyGoalOutcomeParams) => {
            const result = await applyGoalOutcome(blockId, body);
            if (settle) await settleGoalOutcome(blockId, settle);
            return result;
        },
        onSuccess: (_data, { blockId, body }) => {
            if (body.action === 'REMIND_LATER') return;
            if (body.action === 'CLEANUP') {
                void Promise.all([
                    queryClient.invalidateQueries({
                        queryKey: blockKeys.all,
                        predicate: (query) => query.queryKey[1] !== blockId,
                    }),
                    queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
                ]);
                return;
            }
            void queryClient.invalidateQueries({ queryKey: blockKeys.all });
        },
        onError: (_error, { body }) => {
            if (body.action === 'REMIND_LATER') return;
            return queryClient.invalidateQueries({ queryKey: blockKeys.all });
        },
    });
}
