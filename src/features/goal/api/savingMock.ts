import { BLOCK_HOME_MOCK } from '@/features/block/api/blockHomeMock';
import { formatAmount } from '@/lib/format';
import { ApiError } from '@/shared/types/api';

import type {
    ExcludedSpending,
    SavingGoalCreateRequest,
    SavingGoalDraftResponse,
    SavingGoalProgress,
    SavingGoalTargetBlockResponse,
    SavingOverview,
    SavingSuggestion,
    SavingSuggestionList,
} from '@/features/goal/types/saving';

/**
 * 절약 탭 목업 (API 명세 v4 8장 응답 예시 · 시안 05 값)
 * 관심 없음·다시 포함을 눌러 보면 바뀌도록 메모리에 상태를 둔다. 앱을 끄면 처음으로 돌아간다.
 * TODO: 절약 API가 서버에 생기면 지운다.
 */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const toDateString = (date: Date) => date.toISOString().slice(0, 10);

/**
 * 목업 날짜를 오늘(한국 시간)에 맞춘다. 헤더의 이번 달과 어긋나지 않게 하려고.
 * 진행 중인 목표는 이번 달 말일까지, 확정은 다음 달 1일, 확정된 절약분은 지난달 것.
 */
function mockDates() {
    const today = new Date(Date.now() + KST_OFFSET_MS);
    const year = today.getUTCFullYear();
    const month = today.getUTCMonth();
    return {
        lastMonth: toDateString(new Date(Date.UTC(year, month - 1, 1))).slice(0, 7),
        endOfMonth: toDateString(new Date(Date.UTC(year, month + 1, 0))),
        firstOfNextMonth: toDateString(new Date(Date.UTC(year, month + 1, 1))),
    };
}

const { lastMonth, endOfMonth, firstOfNextMonth } = mockDates();

const OVERVIEW_BASE: Omit<SavingOverview, 'suggestionCount' | 'suggestionTotal'> = {
    // 홈 목업의 절약분 대기 자금(waitingFundId 1)과 같은 값
    confirmed: {
        waitingFundId: 1,
        month: lastMonth,
        amount: 87_000,
        text: '생활비에서 꺼내 홈의 절약분 블록에 모아뒀어요',
    },
    activeGoals: {
        confirmDate: firstOfNextMonth,
        expectedSaving: 86_000,
        limitSaving: 98_000,
        goals: [
            {
                savingGoalId: 9,
                category: '배달',
                paceLabel: '지금 속도면 +41,000',
                paceSaving: 41_000,
                spent: 41_000,
                limit: 72_000,
                spentUntilTodayPlan: 32_400,
                baseAmount: 132_000,
                endDate: endOfMonth,
                onPlan: false,
            },
            {
                savingGoalId: 10,
                category: '카페',
                paceLabel: '지금 속도면 +45,000',
                paceSaving: 45_000,
                spent: 12_000,
                limit: 34_000,
                spentUntilTodayPlan: 15_300,
                baseAmount: 72_000,
                endDate: endOfMonth,
                onPlan: true,
            },
        ],
    },
};

const INITIAL_SUGGESTIONS: SavingSuggestion[] = [
    {
        suggestionId: 21,
        category: { categoryId: 4, code: 'TRANSPORT', name: '택시' },
        reason: 'INCREASED',
        reasonLabel: '3달 평균보다 +25%',
        action: '월 6회 → 월 3회로 줄이기',
        baseAmount: 84_000,
        baseCount: '월 6회',
        expectedSaving: 42_000,
        status: 'PENDING',
    },
    {
        suggestionId: 22,
        category: { categoryId: 7, code: 'CONVENIENCE_STORE', name: '편의점' },
        reason: 'REPEATED',
        reasonLabel: '반복 소비',
        action: '주 5회 → 주 3회로 줄이기',
        baseAmount: 61_000,
        baseCount: '주 5회',
        expectedSaving: 24_000,
        status: 'PENDING',
    },
    {
        suggestionId: 23,
        category: { categoryId: 11, code: 'SUBSCRIPTION', name: 'OTT 구독' },
        reason: 'DUPLICATE',
        reasonLabel: '반복 소비',
        action: '2개 중 1개만 유지하기',
        baseAmount: 27_000,
        baseCount: null,
        expectedSaving: 13_500,
        status: 'PENDING',
    },
];

const INITIAL_EXCLUDED: ExcludedSpending[] = [
    {
        label: '배달 2건',
        amount: 46_000,
        reason: '야근·업무로 답해서 줄일 수 없는 지출로 봤어요',
        transactionIds: [77, 81],
    },
];

/** 후보마다 제안하는 목표 지출액과 버튼 문구 (시안 12 택시 값) */
const RECOMMENDATIONS: Record<number, { limit: number; label: string | null }> = {
    21: { limit: 42_000, label: '월 3회' },
    22: { limit: 37_000, label: '주 3회' },
    23: { limit: 13_500, label: '1개만' },
};

/** 홈 목업의 목표 블록(저축 2 · 여행 3)과 같은 값 */
const TARGET_BLOCKS: SavingGoalTargetBlockResponse[] = [
    {
        blockId: 3,
        name: '여행',
        color: 'O',
        status: 'CAUTION',
        fillRate: 40,
        statusLabel: '2주 늦어지는 중',
    },
    { blockId: 2, name: '저축', color: 'J', status: 'SAFE', fillRate: 67, statusLabel: null },
];

/** 오늘(한국 시간)부터 한 달. 10월 15일 → 11월 14일 */
function oneMonthFromToday() {
    const today = new Date(Date.now() + KST_OFFSET_MS);
    const start = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
    );
    const end = new Date(
        Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, start.getUTCDate() - 1),
    );
    return { startDate: toDateString(start), endDate: toDateString(end) };
}

/** 진행 중인 목표가 확정되는 날 = 끝난 다음 날 */
function nextDay(date: string) {
    const [year, month, day] = date.split('-').map(Number);
    return toDateString(new Date(Date.UTC(year, month - 1, day + 1)));
}

/** true로 바꾸면 진행 중인 목표가 없는 빈 상태를 확인할 수 있다. */
const MOCK_NO_ACTIVE_GOALS = false;

let suggestions = INITIAL_SUGGESTIONS;
let excluded = INITIAL_EXCLUDED;
/** 목표 시작하기로 새로 세운 목표 */
let addedGoals: SavingGoalProgress[] = [];
let nextSavingGoalId = 100;

const pendingSuggestions = () => suggestions.filter(({ status }) => status === 'PENDING');

/** 서버처럼 후보 개수·합계는 남은 후보로 다시 센다. */
/**
 * 확정 절약분은 홈 목업의 절약분 나눌 돈을 따라간다.
 * 배분하기(06)에서 나누면 남은 금액이 줄고, 다 나누면 배너가 사라진다.
 */
function confirmedSaving(): SavingOverview['confirmed'] {
    const base = OVERVIEW_BASE.confirmed;
    if (!base) return null;
    const fund = BLOCK_HOME_MOCK.pendingMoney.find(
        (item) => item.waitingFundId === base.waitingFundId,
    );
    return fund ? { ...base, amount: fund.amount } : null;
}

export function getSavingOverviewMock(): SavingOverview {
    const pending = pendingSuggestions();
    const baseGoals = MOCK_NO_ACTIVE_GOALS ? null : OVERVIEW_BASE.activeGoals;
    const goals = [...(baseGoals?.goals ?? []), ...addedGoals];
    const activeGoals =
        goals.length === 0
            ? null
            : {
                  confirmDate: baseGoals?.confirmDate ?? nextDay(goals[0].endDate),
                  expectedSaving: goals.reduce((sum, goal) => sum + goal.paceSaving, 0),
                  limitSaving: goals.reduce((sum, goal) => sum + goal.baseAmount - goal.limit, 0),
                  goals,
              };
    return {
        ...OVERVIEW_BASE,
        confirmed: confirmedSaving(),
        activeGoals,
        suggestionCount: pending.length,
        suggestionTotal: pending.reduce((sum, { expectedSaving }) => sum + expectedSaving, 0),
    };
}

/** 서버는 관심 없음으로 넘긴 후보를 목록에서 뺀다. */
export function getSavingSuggestionsMock(): SavingSuggestionList {
    return { suggestions: pendingSuggestions(), excluded };
}

/**
 * 서버처럼 아직 남은(PENDING) 후보만 목표로 세울 수 있다.
 * TODO: 에러 코드는 명세에 없어 가정값이다. 서버 API가 나오면 맞춘다.
 */
function findPendingSuggestion(suggestionId: number) {
    const suggestion = suggestions.find((item) => item.suggestionId === suggestionId);
    if (!suggestion) {
        throw new ApiError('SAVING_SUGGESTION_NOT_FOUND', '절약 후보를 찾지 못했어요', 404);
    }
    if (suggestion.status !== 'PENDING') {
        throw new ApiError(
            'SAVING_SUGGESTION_NOT_PENDING',
            '이미 목표로 정했거나 뺀 후보예요',
            409,
        );
    }
    return suggestion;
}

export function getSavingGoalDraftMock(suggestionId: number): SavingGoalDraftResponse {
    const suggestion = findPendingSuggestion(suggestionId);
    const recommendation = RECOMMENDATIONS[suggestionId] ?? {
        limit: suggestion.baseAmount - suggestion.expectedSaving,
        label: null,
    };
    return {
        suggestionId,
        category: suggestion.category.name,
        action: suggestion.action,
        baseAmount: suggestion.baseAmount,
        recommendedLimit: recommendation.limit,
        recommendedLabel: recommendation.label,
        ...oneMonthFromToday(),
        periodMonths: 1,
        recommendedBlockId: TARGET_BLOCKS[0].blockId,
        targetBlocks: TARGET_BLOCKS,
    };
}

/** 후보를 목표로 바꾸고, 진행 중인 목표에 붙인다. */
export function createSavingGoalMock({ suggestionId, limit, endDate }: SavingGoalCreateRequest) {
    const suggestion = findPendingSuggestion(suggestionId);
    if (limit < 0 || limit >= suggestion.baseAmount) {
        throw new ApiError('SAVING_LIMIT_INVALID', '기준 지출액보다 적게 정해 주세요', 400);
    }
    const saving = suggestion.baseAmount - limit;
    suggestions = suggestions.map((item) =>
        item.suggestionId === suggestionId ? { ...item, status: 'GOAL_SET' as const } : item,
    );
    addedGoals = [
        ...addedGoals,
        {
            savingGoalId: nextSavingGoalId++,
            category: suggestion.category.name,
            paceLabel: `지금 속도면 +${formatAmount(saving, { showUnit: false })}`,
            paceSaving: saving,
            spent: 0,
            limit,
            spentUntilTodayPlan: 0,
            baseAmount: suggestion.baseAmount,
            endDate,
            onPlan: true,
        },
    ];
}

export function dismissSuggestionMock(suggestionId: number) {
    suggestions = suggestions.map((suggestion) =>
        suggestion.suggestionId === suggestionId
            ? { ...suggestion, status: 'DISMISSED' as const }
            : suggestion,
    );
}

export function includeExcludedSpendingMock(transactionIds: number[]) {
    excluded = excluded.filter(
        (item) => !item.transactionIds.some((id) => transactionIds.includes(id)),
    );
}
