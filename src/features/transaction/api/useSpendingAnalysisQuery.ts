import { useQuery } from '@tanstack/react-query';

import { getSpendingAnalysis } from './transactionApi';
import { transactionKeys } from './transactionKeys';

/** 소비 분석 (month가 null이면 이번 달) */
export function useSpendingAnalysisQuery(month: string | null) {
    return useQuery({
        queryKey: transactionKeys.analysis(month),
        queryFn: () => getSpendingAnalysis(month),
    });
}
