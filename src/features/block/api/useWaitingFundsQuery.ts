import { useQuery } from '@tanstack/react-query';

import { getWaitingFunds } from './blockApi';
import { blockKeys } from './blockKeys';

export function useWaitingFundsQuery() {
    return useQuery({ queryKey: blockKeys.waitingFunds(), queryFn: getWaitingFunds });
}
