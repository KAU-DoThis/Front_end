import type { SpendingAnalysis } from '@/shared/types/spendingAnalysis';

/**
 * 소비 분석 목업 (10월: 시안 11 숫자 그대로)
 * 서버 모드는 소비 분석 API(/analysis/spending)를 쓰고, 이 파일은 목업 모드(USE_MOCK)에서만 쓴다.
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

/**
 * 9월 한 달 전체 (시안 08 월간 리포트 숫자 그대로 — 총 지출 2,140,000 · 8월 2,230,000 · 배달·카페·쇼핑 변화)
 * 리포트에 안 보이는 분류는 합계가 맞도록 채운 값이다.
 */
const SEPTEMBER_ANALYSIS: SpendingAnalysis = {
    month: '2026-09',
    compareLabel: '8월',
    periodLabel: '9월 1일 ~ 30일',
    isCurrentMonth: false,
    spent: { amount: 2_140_000, previousAmount: 2_230_000, diffAmount: -90_000, diffPercent: -4 },
    categories: [
        { categoryName: '주거', count: 1, amount: 650_000, diffAmount: 0 },
        { categoryName: '식비', count: 38, amount: 410_000, diffAmount: -14_000 },
        { categoryName: '여가', count: 9, amount: 238_000, diffAmount: -24_000 },
        { categoryName: '기타', count: 12, amount: 210_000, diffAmount: -20_000 },
        { categoryName: '쇼핑', count: 7, amount: 129_000, diffAmount: 41_000 },
        { categoryName: '배달', count: 9, amount: 120_000, diffAmount: -52_000 },
        { categoryName: '경조사', count: 2, amount: 120_000, diffAmount: 20_000 },
        { categoryName: '교통', count: 46, amount: 115_000, diffAmount: -6_000 },
        { categoryName: '카페', count: 14, amount: 66_000, diffAmount: -35_000 },
        { categoryName: '통신', count: 1, amount: 55_000, diffAmount: 0 },
        { categoryName: '구독', count: 2, amount: 27_000, diffAmount: 0 },
    ],
    topIncrease: {
        categoryName: '쇼핑',
        diffAmount: 41_000,
        diffPercent: 47,
        previousLabel: '8월',
        currentLabel: '9월',
        previousAmount: 88_000,
        currentAmount: 129_000,
        message: '횟수가 4번에서 7번으로 늘었고, 한 번에 쓰는 돈은 비슷해요.',
    },
    timeOfDay: null,
    recurring: [],
    savingTip: null,
};

const ANALYSIS_BY_MONTH: Record<string, SpendingAnalysis> = {
    [OCTOBER_ANALYSIS.month]: OCTOBER_ANALYSIS,
    [SEPTEMBER_ANALYSIS.month]: SEPTEMBER_ANALYSIS,
};

/** 목업은 9월(월간 리포트)·10월(소비 분석)만 결과가 있다. 다른 달은 쓴 돈이 없는 빈 결과를 준다. */
export function getSpendingAnalysisMock(month: string | null): SpendingAnalysis {
    const target = month ?? OCTOBER_ANALYSIS.month;
    const analysis = ANALYSIS_BY_MONTH[target];
    if (analysis) {
        return analysis;
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
