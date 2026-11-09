import { useQuery } from '@tanstack/react-query';

import { getBlockSetupProposal } from './blockApi';
import { blockKeys } from './blockKeys';

/**
 * 온보딩 블록 구성: AI 제안. 고치는 중에 다시 불러와 덮어쓰지 않도록 자동 새로고침을 끈다.
 * 화면을 떠나면 바로 버린다. 연동 화면으로 돌아가 기관을 바꿨을 수 있어 다시 들어오면 새로 받는다.
 */
export function useBlockSetupProposalQuery() {
    return useQuery({
        queryKey: blockKeys.setupProposal(),
        queryFn: getBlockSetupProposal,
        staleTime: Infinity,
        gcTime: 0,
        refetchOnWindowFocus: false,
    });
}
