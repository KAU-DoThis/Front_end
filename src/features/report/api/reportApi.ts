import type { MonthlyReportPage } from '@/features/report/types/monthlyReport';

import { getMonthlyReportMock } from './monthlyReportMock';

/** 목업 응답 지연 (로딩 상태 확인용) */
const MOCK_DELAY_MS = 300;

/**
 * 월간 리포트 (08). month(yyyy-MM)가 null이면 가장 최근 리포트.
 * TODO: 월간 집계 API가 나오면 목업 대신 아래 요청으로 바꾼다. (응답이 화면 모양과 다르면 매퍼를 추가)
 * request<MonthlyReportPage>({ method: 'GET', url: '/reports/monthly', params: month ? { month } : undefined })
 */
export const getMonthlyReport = (month: string | null): Promise<MonthlyReportPage> =>
    new Promise((resolve) => {
        // 목업 값이 바뀌어도 TanStack Query가 알아채도록 매번 복사해서 준다.
        setTimeout(
            () =>
                resolve(
                    JSON.parse(JSON.stringify(getMonthlyReportMock(month))) as MonthlyReportPage,
                ),
            MOCK_DELAY_MS,
        );
    });
