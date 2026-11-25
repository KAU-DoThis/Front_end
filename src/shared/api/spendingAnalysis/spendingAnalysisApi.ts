import { request } from '@/lib/apiClient';
import { todayInKorea } from '@/lib/date';
import { USE_MOCK } from '@/lib/mock';
import type { SpendingAnalysis } from '@/shared/types/spendingAnalysis';
import type { SpendingAnalysisResponse } from '@/shared/types/spendingAnalysisResponse';

import { toSpendingAnalysis } from './spendingAnalysisMapper';
import { getSpendingAnalysisMock } from './spendingAnalysisMock';

/** 목업 응답 지연 (로딩 상태 확인용) */
const MOCK_DELAY_MS = 300;

/** 소비 분석 (11 · 08). month(yyyy-MM)가 null이면 이번 달. 목업 모드에서는 목업을 쓴다. */
export const getSpendingAnalysis = async (month: string | null): Promise<SpendingAnalysis> => {
    if (USE_MOCK) {
        return new Promise((resolve) => {
            // 목업 값이 바뀌어도 TanStack Query가 알아채도록 매번 복사해서 준다.
            setTimeout(
                () =>
                    resolve(
                        JSON.parse(
                            JSON.stringify(getSpendingAnalysisMock(month)),
                        ) as SpendingAnalysis,
                    ),
                MOCK_DELAY_MS,
            );
        });
    }
    const response = await request<SpendingAnalysisResponse>({
        method: 'GET',
        url: '/analysis/spending',
        params: month ? { month } : undefined,
    });
    return toSpendingAnalysis(response, todayInKorea());
};
