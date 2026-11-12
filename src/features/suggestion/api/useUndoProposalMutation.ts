import { useMutation, useQueryClient } from '@tanstack/react-query';

import { blockKeys } from '@/features/block/api/blockKeys';

import { undoProposal } from './coachApi';

/** 옮긴 것 되돌리기 — 블록 잔액이 바뀌므로 블록 데이터를 다시 받는다. */
export function useUndoProposalMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: undoProposal,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: blockKeys.all }),
    });
}
