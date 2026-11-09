import type { SpendingAnalysis } from '@/features/transaction/types/spendingAnalysis';

/**
 * 소비 분석 목업 (시안 11 숫자 그대로)
 * TODO: 소비 분석 API가 붙으면 이 파일을 지운다.
 */
const OCTOBER_ANALYSIS: SpendingAnalysis = {
    month: '2026-10',
    compareLabel: '9월 같은 기간',
    periodLabel: '10월 1일 ~ 14일',
    isCurrentMonth: true,
    spent: { amount: 588_000, previousAmount: 524_000, diffAmount: 64_000, diffPercent: 12 },
    categories: [
        { categoryName: '배달', count: 13, amount: 182_000, diffAmount: 50_000 },
        { categoryName: '생필품·쇼핑', count: 6, amount: 147_800, diffAmount: 4_000 },
        { categoryName: '식비', count: 11, amount: 96_200, diffAmount: -8_000 },
        { categoryName: '카페', count: 15, amount: 76_500, diffAmount: 21_000 },
        { categoryName: '교통', count: 24, amount: 58_500, diffAmount: -3_000 },
        { categoryName: '구독', count: 2, amount: 27_000, diffAmount: 0 },
    ],
    topIncrease: {
        categoryName: '배달',
        diffAmount: 50_000,
        diffPercent: 38,
        previousLabel: '9월',
        currentLabel: '10월',
        previousAmount: 132_000,
        currentAmount: 182_000,
        message: '횟수가 9번에서 13번으로 늘었고, 한 번에 쓰는 돈은 비슷해요.',
    },
    timeOfDay: {
        targetLabel: '배달 13번',
        headline: [
            { text: '13번 중 9번', isBold: true },
            { text: '이 밤 10시 이후였어요', isBold: false },
        ],
        slots: [
            { label: '아침', range: '6~11시', count: 0, isPeak: false },
            { label: '점심', range: '11~15시', count: 2, isPeak: false },
            { label: '저녁', range: '15~22시', count: 2, isPeak: false },
            { label: '밤', range: '22시~', count: 9, isPeak: true },
        ],
        footnote: '야근 식대로 표시한 2건(46,000원)은 절약 후보에서 뺐어요',
    },
    recurring: [
        {
            name: '카페',
            tag: '반복 소비',
            description: '15회  스타벅스 9회, 그 외 6회',
            amount: 76_500,
        },
        {
            name: 'OTT 구독',
            tag: '중복',
            description: '넷플릭스  티빙 같이 구독 중',
            amount: 27_000,
        },
        {
            name: '통신비',
            tag: '고정',
            description: '매월 15일 자동이체  고정지출 블록',
            amount: 55_000,
        },
    ],
    savingTip: {
        message: [
            { text: '배달이랑 카페만 조금 줄여도 ', isBold: false },
            { text: '한 달에 약 98,000원', isBold: true },
            { text: '을 아낄 수 있어요. 여행 목표도 3주 빨라져요.', isBold: false },
        ],
    },
};

/** 목업은 10월만 분석 결과가 있다. 다른 달은 쓴 돈이 없는 빈 결과를 준다. */
export function getSpendingAnalysisMock(month: string | null): SpendingAnalysis {
    const target = month ?? OCTOBER_ANALYSIS.month;
    if (target === OCTOBER_ANALYSIS.month) {
        return OCTOBER_ANALYSIS;
    }
    const monthNumber = Number(target.slice(5, 7));
    const previousMonth = monthNumber === 1 ? 12 : monthNumber - 1;
    return {
        month: target,
        compareLabel: `${previousMonth}월 같은 기간`,
        periodLabel: `${monthNumber}월`,
        isCurrentMonth: false,
        spent: { amount: 0, previousAmount: 0, diffAmount: 0, diffPercent: 0 },
        categories: [],
        topIncrease: null,
        timeOfDay: null,
        recurring: [],
        savingTip: null,
    };
}
