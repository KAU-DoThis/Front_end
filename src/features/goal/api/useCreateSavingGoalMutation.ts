import { useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query';

import { invalidateSavingData } from './invalidateSavingData';
import { createSavingGoal } from './savingApi';
import { savingKeys } from './savingKeys';

const createMutationKey = [...savingKeys.all, 'createGoal'] as const;

/** 절약 목표 시작하기 — 후보 목록과 진행 중인 목표가 바뀌므로 다시 받는다. */
export function useCreateSavingGoalMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: createMutationKey,
        mutationFn: createSavingGoal,
        // 다시 받기가 끝날 때까지 기다려서, 시트가 닫힌 뒤 후보 카드가 바로 사라지게 한다.
        onSuccess: () => invalidateSavingData(queryClient),
    });
}

/** 목표 시작하기를 보내는 중인지 (시트가 그동안 닫히지 않게 막는 데 쓴다) */
export function useIsCreatingSavingGoal() {
    return useIsMutating({ mutationKey: createMutationKey }) > 0;
}
