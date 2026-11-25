// 월간 리포트 (08) 화면 모양. 지출 합계는 소비 분석(useSpendingAnalysisQuery)에서 가져오고,
// 여기에는 리포트에만 있는 값만 둔다. 모든 숫자는 서버가 계산한다. (F-12 · F-14)
// TODO: 월간 집계 API(GET /reports/monthly?month=)가 나오면 응답 필드에 맞춘다. (지금은 시안 08 기준 가정값)

/**
 * 금융관리 점수 항목 (백엔드 기능명세서 F-14 기준 4개)
 * - FIXED_SECURED: 고정지출 확보율 (30점)
 * - LIVING_PACE: 생활비 페이스 준수 (20점)
 * - SAVING_GOAL: 절약 목표 달성 (25점)
 * - GOAL_FUNDING: 목표 블록 월 확보 (25점)
 */
export type ScoreItemCode = 'FIXED_SECURED' | 'LIVING_PACE' | 'SAVING_GOAL' | 'GOAL_FUNDING';

export interface MonthlyReport {
    /** 리포트 달 (yyyy-MM) */
    month: string;
    /** 비교하는 달 (yyyy-MM) */
    previousMonth: string;
    /** 금융관리 점수 (팀 결정 전이라 없을 수 있다) */
    score: {
        /** 0~100 */
        value: number;
        /** 지난달 대비 (지난달 점수가 없으면 null) */
        diff: number | null;
        items: { code: ScoreItemCode; percent: number }[];
    } | null;
    saving: {
        /** 이 달 확정된 절약액 */
        amount: number;
        /** 절약 탭에서 정한 절약 목표 금액 합 (목표가 없으면 null) */
        targetAmount: number | null;
    };
    /** 절약분을 블록에 나눈 결과 */
    allocation: {
        amount: number;
        /** 받은 블록 이름 (많이 받은 순) */
        blockNames: string[];
    };
    /** 날짜별 누적 지출 (1일부터 말일까지, 원) */
    dailySpending: {
        current: number[];
        /** 비교할 지난달 기록이 없으면 null */
        previous: number[] | null;
    };
    /** 주요 소비 변화 (서버가 고른 순서 그대로) */
    topChanges: {
        categoryName: string;
        previousAmount: number;
        currentAmount: number;
        diffAmount: number;
    }[];
    /** 에이전트의 한 달 정리 (문장 생성에 실패하면 null — 숫자만 보여준다) */
    agentComment: string | null;
}

export interface MonthlyReportPage {
    /** 보여주는 달 (yyyy-MM) */
    month: string;
    /** 리포트가 있는 가장 최근 달 (이번 달은 아직 리포트가 없다) */
    latestMonth: string;
    /** 이 달 리포트가 없으면 null */
    report: MonthlyReport | null;
}
