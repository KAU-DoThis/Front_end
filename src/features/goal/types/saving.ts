/**
 * 절약 탭 (API 명세 v4 8장 · 시안 05 절약)
 * 서버 응답 그대로의 모양이다. 서버 API가 생기면 이 타입에 맞춰 붙인다.
 */

/** 확정 절약분. 생활비에서 꺼내 절약분 대기 자금(SAVING)으로 옮긴 금액 */
export interface ConfirmedSaving {
    /** 배분하기(06) 화면에서 쓸 대기 자금 id */
    waitingFundId: number;
    /** 절약 목표를 세운 달 (yyyy-MM) */
    month: string;
    amount: number;
    /** 배너 아래 안내 (예: 생활비에서 꺼내 홈의 절약분 블록에 모아뒀어요) */
    text: string;
}

/** 진행 중인 절약 목표 한 개 */
export interface SavingGoalProgress {
    savingGoalId: number;
    /** 카테고리 이름 (예: 배달) */
    category: string;
    /** 예: 지금 속도면 +41,000 */
    paceLabel: string;
    /** 지금 속도로 월말까지 쓰면 아낄 금액. 음수면 기준보다 더 쓰는 중 */
    paceSaving: number;
    /** 지금까지 쓴 돈 */
    spent: number;
    /** 목표 한도 (한 달 목표 지출액) */
    limit: number;
    /** 계획대로라면 오늘까지 써도 되는 돈 (진행 바의 오늘 마커) */
    spentUntilTodayPlan: number;
    /** 기준 지출액 (최근 3달 평균) */
    baseAmount: number;
    /** yyyy-MM-dd */
    endDate: string;
    /** 계획대로 쓰는 중인지. false면 주의 */
    onPlan: boolean;
}

export interface ActiveSavingGoals {
    /** 목표들이 확정되는 날 (yyyy-MM-dd) */
    confirmDate: string;
    /** 지금까지 쓴 속도로 월말까지 쓴다고 본 예상 절약액 */
    expectedSaving: number;
    /** 한도대로 쓸 때 절약액 */
    limitSaving: number;
    goals: SavingGoalProgress[];
}

/** GET /savings/overview */
export interface SavingOverview {
    /** 확정 절약분이 없으면 null (배너를 숨긴다) */
    confirmed: ConfirmedSaving | null;
    /** 진행 중인 목표가 없으면 null */
    activeGoals: ActiveSavingGoals | null;
    /** 줄일 수 있는 지출(후보) 개수 */
    suggestionCount: number;
    /** 후보를 모두 목표로 세우면 아낄 수 있는 월 금액 */
    suggestionTotal: number;
}

/** INCREASED: 3달 평균보다 늘어남 · REPEATED: 반복 소비 · DUPLICATE: 중복 구독 */
export type SavingSuggestionReason = 'INCREASED' | 'REPEATED' | 'DUPLICATE';

export type SavingSuggestionStatus = 'PENDING' | 'DISMISSED' | 'GOAL_SET';

export interface SavingSuggestion {
    suggestionId: number;
    category: { categoryId: number; code: string; name: string };
    reason: SavingSuggestionReason;
    /** 오른쪽 위 태그 (예: 3달 평균보다 +25%, 반복 소비) */
    reasonLabel: string;
    /** 예: 월 6회 → 월 3회로 줄이기 */
    action: string;
    /** 최근 3달 평균 지출 */
    baseAmount: number;
    /** 예: 월 6회. 중복 구독처럼 횟수가 없으면 null */
    baseCount: string | null;
    /** 월 예상 절약액 */
    expectedSaving: number;
    status: SavingSuggestionStatus;
}

/** 줄일 수 없다고 답해서 후보에서 뺀 지출 */
export interface ExcludedSpending {
    /** 예: 배달 2건 */
    label: string;
    amount: number;
    /** 예: 야근·업무로 답해서 줄일 수 없는 지출로 봤어요 */
    reason: string;
    /** 다시 포함할 때 쓰는 거래 id */
    transactionIds: number[];
}

/** GET /savings/suggestions */
export interface SavingSuggestionList {
    suggestions: SavingSuggestion[];
    excluded: ExcludedSpending[];
}

/** 절약 목표 설정 시트에서 고를 수 있는 목표 블록 (확정되면 절약분을 넣을 곳) */
export interface SavingGoalTargetBlock {
    blockId: number;
    name: string;
    /** 블록 색 (I · O · T · S · Z · J · L) */
    color: string;
    status: 'SAFE' | 'CAUTION' | 'DANGER';
    /** 물 높이 0~100 */
    fillRate: number;
    /** 이름 아래 상태 문구 (예: 2주 늦어지는 중). 없으면 null */
    statusLabel: string | null;
}

/** GET /saving-goals/draft?suggestionId= — 절약 목표 설정 시트(12) 초기값 */
export interface SavingGoalDraft {
    suggestionId: number;
    /** 카테고리 이름 (예: 택시) */
    category: string;
    /** 예: 월 6회 → 월 3회로 줄이기 */
    action: string;
    /** 기준 지출액 (최근 3달 평균) */
    baseAmount: number;
    /** 제안하는 한 달 목표 지출액 */
    recommendedLimit: number;
    /** 제안 버튼 문구 (예: 월 3회). 없으면 null */
    recommendedLabel: string | null;
    /** yyyy-MM-dd */
    startDate: string;
    /** yyyy-MM-dd */
    endDate: string;
    /** 기간 개월 수 */
    periodMonths: number;
    /** 처음에 골라 둘 블록. 없으면 null ('나중에') */
    recommendedBlockId: number | null;
    targetBlocks: SavingGoalTargetBlock[];
}

/** POST /saving-goals */
export interface SavingGoalCreateRequest {
    suggestionId: number;
    /** 한 달 목표 지출액 */
    limit: number;
    startDate: string;
    endDate: string;
    /** 확정되면 절약분을 넣을 블록. 나중에 고르면 null */
    targetBlockId: number | null;
}
