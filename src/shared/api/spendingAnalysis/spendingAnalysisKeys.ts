/**
 * 소비 분석 query key
 * 거래가 바뀌면(transactionKeys.all 갱신) 같이 갱신되도록 ['transactions'] 아래에 둔다.
 */
export const spendingAnalysisKeys = {
    all: ['transactions', 'analysis'] as const,
    month: (month: string | null) => [...spendingAnalysisKeys.all, month] as const,
};
