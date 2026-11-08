import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';

import type { TransactionListParams } from '@/features/transaction/types/transaction';

import { getTransactionList } from './transactionApi';
import { transactionKeys } from './transactionKeys';

/** 거래 목록. '이전 거래 더 보기'로 다음 쪽을 이어 받는다. 필터를 바꾸는 동안은 이전 목록을 보여준다. */
export function useTransactionListQuery(params: TransactionListParams) {
    return useInfiniteQuery({
        queryKey: transactionKeys.list(params),
        queryFn: ({ pageParam }) => getTransactionList(params, pageParam),
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        placeholderData: keepPreviousData,
    });
}
