import { useMutation, useQueryClient } from '@tanstack/react-query';

import { blockKeys } from '@/features/block/api/blockKeys';

import { acceptProposal } from './coachApi';

/** 이동 제안 수락 — 블록 잔액이 바뀌므로 블록 데이터를 다시 받는다. */
export function useAcceptProposalMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: acceptProposal,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: blockKeys.all }),
    });
}
