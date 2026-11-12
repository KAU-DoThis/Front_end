/** GET /analysis/spending 응답 (Back_end SpendingAnalysisResponse) */
export interface SpendingAnalysisResponse {
    /** 이번 달이면 to가 오늘, 지난 달이면 말일 (yyyy-MM-dd) */
    period: { from: string; to: string };
    compareTo: { from: string; to: string; label: string };
    totalSpent: number;
    /** previousAvailable이 false면 비교 값은 모두 null */
    previousSpent: number | null;
    changeAmount: number | null;
    changeRate: number | null;
    /** 쓴 돈이 많은 순. 분류 전 거래는 categoryId=null, code=UNCLASSIFIED */
    categories: SpendingCategoryResponse[];
    /** 가장 많이 늘어난 카테고리 (미분류 제외). 없거나 비교할 수 없으면 null */
    biggestIncrease: BiggestIncreaseResponse | null;
    /** REPEAT → DUPLICATE_SUBSCRIPTION → FIXED 순 */
    recurring: RecurringSpendingResponse[];
    previousAvailable: boolean;
    /** 기간 안에 쓴 돈이 없으면 true */
    empty: boolean;
}

export interface SpendingCategoryResponse {
    categoryId: number | null;
    code: string;
    name: string;
    count: number;
    amount: number;
    changeAmount: number | null;
}

export interface BiggestIncreaseResponse {
    categoryId: number;
    name: string;
    changeAmount: number;
    /** 지난 기간이 0원이면 null */
    changeRate: number | null;
    previousAmount: number;
    explanation: string;
    timeOfDay: { slot: string; label: string; count: number }[];
    timeSummary: string | null;
    excludedNote: string | null;
}

export interface RecurringSpendingResponse {
    kind: 'REPEAT' | 'DUPLICATE_SUBSCRIPTION' | 'FIXED';
    /** REPEAT·DUPLICATE_SUBSCRIPTION은 카테고리 이름, FIXED는 받는 곳 */
    label: string;
    summary: string;
    /** FIXED는 최근 낸 금액, 나머지는 기간 안 합계 */
    amount: number;
}
