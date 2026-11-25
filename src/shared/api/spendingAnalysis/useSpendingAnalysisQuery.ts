import { useQuery } from '@tanstack/react-query';

import { getSpendingAnalysis } from './spendingAnalysisApi';
import { spendingAnalysisKeys } from './spendingAnalysisKeys';

/** 소비 분석 (month가 null이면 이번 달) — 내역 탭 소비 분석 · 월간 리포트 */
export function useSpendingAnalysisQuery(month: string | null) {
    return useQuery({
        queryKey: spendingAnalysisKeys.month(month),
        queryFn: () => getSpendingAnalysis(month),
    });
}
