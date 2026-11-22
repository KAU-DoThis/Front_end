import { useMutation, useMutationState, useQueryClient } from '@tanstack/react-query';

import { dismissSavingSuggestion } from './savingApi';
import { savingKeys } from './savingKeys';

const dismissMutationKey = [...savingKeys.all, 'dismiss'] as const;

/** 절약 후보 관심 없음 — 후보 목록과 요약(후보 개수·합계)을 다시 받는다. */
export function useDismissSavingSuggestionMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: dismissMutationKey,
        mutationFn: dismissSavingSuggestion,
        // 다시 받기가 끝날 때까지 기다려서, 카드가 사라지기 전에 버튼이 다시 눌리지 않게 한다.
        onSuccess: () => queryClient.invalidateQueries({ queryKey: savingKeys.all }),
    });
}

/** 관심 없음을 보내는 중인 후보 id들 (여러 개를 연달아 눌러도 모두 잡는다) */
export function useDismissingSuggestionIds() {
    return useMutationState({
        filters: { mutationKey: dismissMutationKey, status: 'pending' },
        select: (mutation) => mutation.state.variables as number,
    });
}
