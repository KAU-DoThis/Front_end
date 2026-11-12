import { useMutation, useQueryClient } from '@tanstack/react-query';

import { blockKeys } from '@/features/block/api/blockKeys';

import { answerQuestion } from './transactionApi';
import { transactionKeys } from './transactionKeys';

/** 에이전트 질문 답변 — 분류가 바뀌므로 거래 목록·소비 분석과 블록 잔액을 다시 받는다. */
export function useAnswerQuestionMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: answerQuestion,
        onSuccess: () =>
            Promise.all([
                queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
                queryClient.invalidateQueries({ queryKey: blockKeys.all }),
            ]),
    });
}
