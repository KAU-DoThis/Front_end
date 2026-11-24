import { useQuery } from '@tanstack/react-query';

import { getSavingGoalDraft } from './savingApi';
import { savingKeys } from './savingKeys';

/** 절약 목표 설정 시트(12) 초기값. 후보를 고르기 전(null)에는 받지 않는다. */
export function useSavingGoalDraftQuery(suggestionId: number | null) {
    return useQuery({
        queryKey: savingKeys.goalDraft(suggestionId ?? 0),
        queryFn: () => getSavingGoalDraft(suggestionId as number),
        enabled: suggestionId !== null,
    });
}
