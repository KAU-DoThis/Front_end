import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { previewQuickInput } from './transactionApi';
import { transactionKeys } from './transactionKeys';

/**
 * 빠른 입력 미리보기. text는 입력을 멈춘 뒤의 값(debounce)을 넘긴다. 비어 있으면 부르지 않는다.
 * 다시 나누는 동안은 이전 미리보기를 그대로 보여준다.
 */
export function useQuickInputPreviewQuery(text: string) {
    return useQuery({
        queryKey: transactionKeys.quickInputPreview(text),
        queryFn: () => previewQuickInput(text),
        enabled: text !== '',
        placeholderData: keepPreviousData,
        staleTime: Infinity,
    });
}
