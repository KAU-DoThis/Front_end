import { useQuery } from '@tanstack/react-query';

import { getDutchPay } from './dutchPayApi';
import { transactionKeys } from './transactionKeys';

/** 이미 만든 더치페이 (수정·해제 시트). dutchPayId가 null이면 받지 않는다. */
export function useDutchPayQuery(dutchPayId: number | null) {
    return useQuery({
        queryKey: transactionKeys.dutchPay(dutchPayId ?? 0),
        queryFn: () => getDutchPay(dutchPayId as number),
        enabled: dutchPayId !== null,
    });
}
