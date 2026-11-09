import { useMutation, useQueryClient } from '@tanstack/react-query';

import { answerQuestion } from './transactionApi';
import { transactionKeys } from './transactionKeys';

/** 에이전트 질문 답변 — 분류가 바뀌므로 거래 목록과 소비 분석을 다시 받는다. */
export function useAnswerQuestionMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: answerQuestion,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
    });
}
