import type {
    ExcludedSpending,
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
    // 홈 목업의 절약분 대기 자금(waitingFundId 12)과 같은 값
    confirmed: {
        waitingFundId: 12,
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

/** true로 바꾸면 진행 중인 목표가 없는 빈 상태를 확인할 수 있다. */
const MOCK_NO_ACTIVE_GOALS = false;

let suggestions = INITIAL_SUGGESTIONS;
let excluded = INITIAL_EXCLUDED;

const pendingSuggestions = () => suggestions.filter(({ status }) => status === 'PENDING');

/** 서버처럼 후보 개수·합계는 남은 후보로 다시 센다. */
export function getSavingOverviewMock(): SavingOverview {
    const pending = pendingSuggestions();
    return {
        ...OVERVIEW_BASE,
        ...(MOCK_NO_ACTIVE_GOALS ? { activeGoals: null } : {}),
        suggestionCount: pending.length,
        suggestionTotal: pending.reduce((sum, { expectedSaving }) => sum + expectedSaving, 0),
    };
}

/** 서버는 관심 없음으로 넘긴 후보를 목록에서 뺀다. */
export function getSavingSuggestionsMock(): SavingSuggestionList {
    return { suggestions: pendingSuggestions(), excluded };
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
