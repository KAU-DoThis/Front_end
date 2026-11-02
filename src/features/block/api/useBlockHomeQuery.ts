import { useQuery } from '@tanstack/react-query';

import { getBlockHome } from './blockApi';
import { blockKeys } from './blockKeys';

export function useBlockHomeQuery() {
    return useQuery({ queryKey: blockKeys.home(), queryFn: getBlockHome });
}
