import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ApplyGoalGuardRequest } from '@/features/block/types/goalGuard';
import { savingKeys } from '@/features/goal/api/savingKeys';

import { applyGoalGuard } from './blockApi';
import { blockKeys } from './blockKeys';

interface ApplyGoalGuardParams {
    blockId: number;
    body: ApplyGoalGuardRequest;
}

const isGoalGuardKey = (queryKey: readonly unknown[]) =>
    queryKey[queryKey.length - 1] === 'goal-guard';

/**
 * 목표 지키기 반영 — 성공·실패 모두 홈·상세·블록 목록을 다시 받는다.
 * 절약분 넣기는 나눌 돈을 쓰므로 절약 탭 배너도 다시 받는다.
 * 목표 지키기 자체는 실패(409 버전 충돌)일 때만 다시 받는다.
 * 성공하면 블록이 안전이라 다시 받아도 400(NOT_LATE)만 오고 화면도 곧 닫힌다.
 */
export function useApplyGoalGuardMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ blockId, body }: ApplyGoalGuardParams) => applyGoalGuard(blockId, body),
        onSuccess: (_data, { blockId }) =>
            Promise.all([
                queryClient.invalidateQueries({
                    queryKey: blockKeys.all,
                    predicate: (query) => !isGoalGuardKey(query.queryKey),
                }),
                // 다시 받지는 않고 오래된 값으로만 표시해서, 다음에 열면 새로 받게 한다.
                queryClient.invalidateQueries({
                    queryKey: blockKeys.goalGuard(blockId),
                    refetchType: 'none',
                }),
                queryClient.invalidateQueries({ queryKey: savingKeys.all }),
            ]),
        onError: () =>
            Promise.all([
                queryClient.invalidateQueries({ queryKey: blockKeys.all }),
                queryClient.invalidateQueries({ queryKey: savingKeys.all }),
            ]),
    });
}
