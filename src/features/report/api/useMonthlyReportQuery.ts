import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { getMonthlyReport } from './reportApi';
import { reportKeys } from './reportKeys';

/** 월간 리포트 (month가 null이면 가장 최근 리포트). 달을 넘기는 동안 이전 달 화면을 유지한다. */
export function useMonthlyReportQuery(month: string | null) {
    return useQuery({
        queryKey: reportKeys.monthly(month),
        queryFn: () => getMonthlyReport(month),
        placeholderData: keepPreviousData,
    });
}
