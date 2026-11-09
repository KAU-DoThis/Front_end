import { useQuery } from '@tanstack/react-query';

import { agentKeys } from './agentKeys';
import { getAgentRoom } from './agentApi';

export function useAgentRoomQuery() {
    return useQuery({ queryKey: agentKeys.room(), queryFn: getAgentRoom });
}
