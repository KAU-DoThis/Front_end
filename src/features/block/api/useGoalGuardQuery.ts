import { useQuery } from '@tanstack/react-query';

import { getGoalGuard } from './blockApi';
import { blockKeys } from './blockKeys';

/** 목표 지키기 (16): 늦어지는 목표형 블록을 맞출 방법 */
export function useGoalGuardQuery(blockId: number) {
    return useQuery({
        queryKey: blockKeys.goalGuard(blockId),
        queryFn: () => getGoalGuard(blockId),
        enabled: Number.isInteger(blockId) && blockId > 0,
    });
}
