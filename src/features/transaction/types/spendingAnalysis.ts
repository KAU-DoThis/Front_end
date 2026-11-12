import type { RichText } from '@/features/transaction/types/transaction';

// 금액·증감·비율·횟수는 모두 서버가 계산한 값이다. (GET /analysis/spending → spendingAnalysisMapper)

export interface SpendingCategoryStat {
    categoryName: string;
    count: number;
    amount: number;
    /** 지난달 같은 기간 대비 증감 (0이면 변화 없음, 비교할 수 없으면 null) */
    diffAmount: number | null;
}

/** 하루 시간대별 횟수 (아침 6~11시 · 점심 11~15시 · 저녁 15~22시 · 밤 22시~) */
export interface TimeSlotStat {
    label: string;
    /** 예: 6~11시 */
    range: string;
    count: number;
    /** 가장 많이 쓴 시간대 */
    isPeak: boolean;
}

export interface SpendingAnalysis {
    /** yyyy-MM */
    month: string;
    /** 비교 기간 이름 (예: 9월 같은 기간) */
    compareLabel: string;
    /** 예: 10월 1일 ~ 14일 */
    periodLabel: string;
    isCurrentMonth: boolean;
    spent: {
        amount: number;
        /** 지난 기간과 비교할 수 없으면 null */
        previousAmount: number | null;
        diffAmount: number;
        diffPercent?: number;
    };
    /** 많이 쓴 순서 (화면 순서 그대로) */
    categories: SpendingCategoryStat[];
    /** 가장 많이 늘어난 분류 (늘어난 곳이 없으면 null) */
    topIncrease: {
        categoryName: string;
        diffAmount: number;
        /** 지난 기간이 0원이면 없음 */
        diffPercent?: number;
        /** 예: 9월 · 10월 */
        previousLabel: string;
        currentLabel: string;
        previousAmount: number;
        currentAmount: number;
        /** 예: 횟수가 9번에서 13번으로 늘었고, 한 번에 쓰는 돈은 비슷해요. */
        message: string;
    } | null;
    /** 언제 많이 쓰나요? (대상 분류가 없으면 null) */
    timeOfDay: {
        /** 예: 배달 13번 */
        targetLabel: string;
        headline: RichText;
        slots: TimeSlotStat[];
        /** 예: 야근 식대로 표시한 2건(46,000원)은 절약 후보에서 뺐어요 */
        footnote: string | null;
    } | null;
    /** 반복해서 나가는 돈 */
    recurring: {
        name: string;
        /** 예: 반복 소비 · 중복 · 고정 */
        tag: string;
        description: string;
        amount: number;
    }[];
    /** 에이전트 절약 제안 (없으면 null) */
    savingTip: { message: RichText } | null;
}
