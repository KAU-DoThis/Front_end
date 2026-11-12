import { useQuery } from '@tanstack/react-query';

import { agentKeys } from './agentKeys';
import { getCoachRoom } from './coachApi';

/** 대화 세션 (방에 있는 동안 같은 세션을 쓴다) */
export function useCoachRoomQuery() {
    return useQuery({
        queryKey: agentKeys.coachRoom(),
        queryFn: getCoachRoom,
        staleTime: Infinity,
    });
}
