import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';

import type { TransactionListParams } from '@/features/transaction/types/transaction';

import { getTransactionList } from './transactionApi';
import { transactionKeys } from './transactionKeys';

/**
 * 거래 목록. '이전 거래 더 보기'로 다음 쪽(page + 1)을 이어 받는다. 필터를 바꾸는 동안은 이전 목록을 보여준다.
 * 같은 날짜가 두 쪽에 걸칠 수 있어 화면에서는 mergeTransactionDays로 이어 붙인다.
 */
export function useTransactionListQuery(params: TransactionListParams) {
    return useInfiniteQuery({
        queryKey: transactionKeys.list(params),
        queryFn: ({ pageParam }) => getTransactionList(params, pageParam),
        initialPageParam: 0,
        getNextPageParam: (lastPage, _allPages, lastPageParam) =>
            lastPage.hasNext ? lastPageParam + 1 : undefined,
        placeholderData: keepPreviousData,
    });
}
