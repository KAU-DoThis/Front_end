import { useQuery } from '@tanstack/react-query';

import { getBlockDetail } from './blockApi';
import { blockKeys } from './blockKeys';

export function useBlockDetailQuery(blockId: number) {
    return useQuery({
        queryKey: blockKeys.detail(blockId),
        queryFn: () => getBlockDetail(blockId),
        enabled: Number.isFinite(blockId),
    });
}
