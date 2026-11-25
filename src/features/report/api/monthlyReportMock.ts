import type { MonthlyReport, MonthlyReportPage } from '@/features/report/types/monthlyReport';

/**
 * 월간 리포트 목업 (시안 08 숫자 그대로 — 9월 리포트)
 * 목업의 오늘은 소비 분석 목업과 같은 10월 중순이라, 리포트가 있는 가장 최근 달은 9월이다.
 * TODO: 월간 집계 API가 붙으면 이 파일을 지운다.
 */
const LATEST_MONTH = '2026-09';

/**
 * 날짜별 누적 지출 곡선 (목업용). 말일 값이 total과 같고, wave만큼 중간이 부풀어 오른다.
 * wave가 1/π보다 작으면 날마다 늘어나는 곡선이 된다.
 */
function makeCumulative(total: number, days: number, wave: number) {
    return Array.from({ length: days }, (_, index) => {
        const day = index + 1;
        if (day === days) {
            return total;
        }
        const ratio = day / days + wave * Math.sin((day / days) * Math.PI);
        return Math.round((total * ratio) / 1_000) * 1_000;
    });
}

const SEPTEMBER_REPORT: MonthlyReport = {
    month: '2026-09',
    previousMonth: '2026-08',
    // 배점(30·20·25·25)으로 계산하면 78점이 되도록 맞춘 값
    score: {
        value: 78,
        diff: 6,
        items: [
            { code: 'SAVING_GOAL', percent: 89 },
            { code: 'FIXED_SECURED', percent: 100 },
            { code: 'GOAL_FUNDING', percent: 67 },
            { code: 'LIVING_PACE', percent: 45 },
        ],
    },
    saving: { amount: 87_000, targetAmount: 98_000 },
    allocation: { amount: 87_000, blockNames: ['여행', '저축'] },
    dailySpending: {
        current: makeCumulative(2_140_000, 30, 0.02),
        previous: makeCumulative(2_230_000, 31, 0.05),
    },
    topChanges: [
        {
            categoryName: '배달',
            previousAmount: 172_000,
            currentAmount: 120_000,
            diffAmount: -52_000,
        },
        {
            categoryName: '카페',
            previousAmount: 101_000,
            currentAmount: 66_000,
            diffAmount: -35_000,
        },
        {
            categoryName: '쇼핑',
            previousAmount: 88_000,
            currentAmount: 129_000,
            diffAmount: 41_000,
        },
    ],
    agentComment:
        '배달과 카페를 줄여서 87,000원을 모았고, 그 돈으로 여행 목표가 제때 끝날 수 있게 됐어요. 대신 쇼핑이 4만 원 늘었어요. 10월엔 쇼핑을 절약 후보로 같이 볼까요?',
};

/** month가 null이면 가장 최근 리포트. 9월 말고는 리포트가 없는 달로 준다. */
export function getMonthlyReportMock(month: string | null): MonthlyReportPage {
    const target = month ?? LATEST_MONTH;
    return {
        month: target,
        latestMonth: LATEST_MONTH,
        report: target === SEPTEMBER_REPORT.month ? SEPTEMBER_REPORT : null,
    };
}
