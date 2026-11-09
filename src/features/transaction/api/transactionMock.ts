import { ApiError } from '@/shared/types/api';

import type {
    AnswerQuestionRequest,
    ContextAnswerOption,
    ContextQuestion,
    CreateQuickInputRequest,
    QuickInputPreview,
    TransactionBlock,
    TransactionDay,
    TransactionFilterOptions,
    TransactionItem,
    TransactionListPage,
    TransactionListParams,
} from '@/features/transaction/types/transaction';

/**
 * 거래 목록 목업 (시안 09 · 09-1 · 09-2 숫자 그대로)
 * 목업은 서버 대신 필터·합계를 계산한다. 유지·삭제·질문 답변을 하면 값이 바뀐다.
 * TODO: 거래 API가 붙으면 이 파일을 지운다.
 */

/** 목업에서 '이번 달'로 보는 달과 오늘 */
const MOCK_MONTH = '2026-10';
const MOCK_TODAY = '2026-10-14';
/** 한 번에 보내는 날 수 (이전 거래 더 보기 확인용) */
const DAYS_PER_PAGE = 4;
/** 필터 없이 처음 볼 때 쓴 돈은 시안 숫자다. (목업에 없는 이전 거래까지 포함한 값) */
const MOCK_TOTAL_SPENT = 588_000;

const LIVING: TransactionBlock = { blockId: 1, name: '생활비', color: 'i', status: 'CAUTION' };

const FILTER_OPTIONS: TransactionFilterOptions = {
    // 홈 목업(blockHomeMock)과 같은 블록·계좌 id를 쓴다.
    blocks: [
        LIVING,
        { blockId: 2, name: '저축', color: 'j', status: 'SAFE' },
        { blockId: 3, name: '여행', color: 'o', status: 'CAUTION' },
        { blockId: 4, name: '월세', color: 'l', status: 'SAFE' },
        { blockId: 5, name: '저금통', color: 't', status: 'SAFE' },
    ],
    accounts: [
        { linkedAccountId: 1, institutionName: 'KB국민', label: 'KB국민 ••1234' },
        { linkedAccountId: 2, institutionName: '카카오뱅크', label: '카카오뱅크 ••5678' },
        { linkedAccountId: 3, institutionName: 'KB국민카드', label: 'KB국민카드 ••4321' },
    ],
};

/** 목업 안에서만 쓰는 값(어느 계좌 거래인지)을 더한 거래 */
type MockTransaction = TransactionItem & { linkedAccountId: number | null };

const base = {
    direction: 'OUT',
    isCategoryGuess: false,
    paymentMethod: 'CARD',
    isQuickInput: false,
    contextTag: null,
    status: 'CONFIRMED',
    review: null,
    block: LIVING,
} as const;

const createTransactions = (): MockTransaction[] => [
    {
        ...base,
        transactionId: 101,
        occurredAt: '2026-10-14T12:41:00',
        amount: 12_300,
        merchantOrPayee: 'GS25 홍대점',
        categoryName: '편의점',
        isQuickInput: true,
        status: 'PENDING',
        linkedAccountId: null,
    },
    {
        ...base,
        transactionId: 102,
        occurredAt: '2026-10-14T09:10:00',
        amount: 3_000,
        merchantOrPayee: '붕어빵',
        categoryName: null,
        paymentMethod: 'CASH',
        isQuickInput: true,
        linkedAccountId: null,
    },
    {
        ...base,
        transactionId: 103,
        occurredAt: '2026-10-13T19:22:00',
        amount: 38_000,
        merchantOrPayee: '네이버페이',
        categoryName: '생필품',
        isCategoryGuess: true,
        status: 'NEEDS_REVIEW',
        review: { type: 'CATEGORY_QUESTION', questionId: 1 },
        linkedAccountId: 1,
    },
    {
        ...base,
        transactionId: 104,
        occurredAt: '2026-10-13T23:04:00',
        amount: 23_000,
        merchantOrPayee: '배달의민족',
        categoryName: '배달/외식',
        contextTag: '야근',
        linkedAccountId: 1,
    },
    {
        ...base,
        transactionId: 105,
        occurredAt: '2026-10-13T15:20:00',
        amount: 5_900,
        merchantOrPayee: '스타벅스 합정점',
        categoryName: '카페/간식',
        linkedAccountId: 1,
    },
    {
        ...base,
        transactionId: 106,
        occurredAt: '2026-10-12T21:08:00',
        amount: 42_000,
        merchantOrPayee: '쿠팡',
        categoryName: '생활/생필품',
        linkedAccountId: 1,
    },
    {
        ...base,
        transactionId: 107,
        occurredAt: '2026-10-12T12:15:00',
        amount: 7_000,
        merchantOrPayee: '김밥천국 홍대점',
        categoryName: '식비',
        linkedAccountId: 1,
    },
    {
        ...base,
        transactionId: 108,
        occurredAt: '2026-10-10T16:40:00',
        amount: 26_000,
        merchantOrPayee: '올리브영 합정점',
        categoryName: '생활/생필품',
        linkedAccountId: 3,
    },
    {
        ...base,
        transactionId: 109,
        occurredAt: '2026-10-10T11:02:00',
        amount: 4_800,
        merchantOrPayee: 'CU 합정역점',
        categoryName: '편의점',
        isQuickInput: true,
        status: 'NEEDS_REVIEW',
        review: {
            type: 'UNMATCHED_MANUAL',
            message: '직접 넣은 거래가 이틀째 카드 내역에 없어요. 실제로 결제한 게 맞나요?',
        },
        linkedAccountId: null,
    },
];

const ALLOCATIONS: Record<string, TransactionDay['allocation']> = {
    '2026-10-01': { title: '10월 블록 배분', blockCount: 5 },
};

/** 받침이 있으면 '으로', 없으면 '로' (버튼 문구용) */
const withRo = (word: string) => {
    const code = word.charCodeAt(word.length - 1) - 0xac00;
    return code >= 0 && code < 11_172 && code % 28 !== 0 ? `${word}으로` : `${word}로`;
};

/** 고르면 분류를 바꾸고 생활비 블록에 그대로 두는 선택지 */
const option = (
    code: string,
    label: string,
    categoryName: string,
    extra: Partial<ContextAnswerOption> = {},
): ContextAnswerOption => ({
    code,
    label,
    isWide: false,
    buttonTitle: `${withRo(label)} 답하기`,
    result: {
        message: [
            { text: categoryName, isBold: true },
            {
                text: `${withRo(categoryName).slice(categoryName.length)} 바꾸고\n생활비 블록에 그대로 둬요`,
                isBold: false,
            },
        ],
        block: { ...LIVING, fillRate: 61 },
    },
    ruleSuggestion: null,
    ...extra,
});

const QUESTION: ContextQuestion = {
    questionId: 1,
    transactionId: 103,
    bannerMessage: [
        { text: '네이버페이 38,000원', isBold: true },
        { text: ', 무엇을 샀는지 알려줄래요?', isBold: false },
    ],
    sheetMessage: [
        { text: '어제 결제한 ', isBold: false },
        { text: '네이버페이 38,000원', isBold: true },
        { text: ', 무엇을 샀어요?', isBold: false },
    ],
    occurredAt: '2026-10-13T19:22:00',
    accountLabel: 'KB국민 ••1234',
    options: [
        option('DAILY_NECESSITIES', '생필품', '생활/생필품', {
            ruleSuggestion: [
                { text: '지난번에도 이 시간대 네이버페이를 생필품으로 답했어요.\n', isBold: false },
                { text: '다음부터 묻지 않고 자동으로 적용할까요?', isBold: true },
            ],
        }),
        option('FOOD', '식비', '식비'),
        option('CLOTHING', '의류', '의류'),
        option('ETC', '기타', '기타'),
        option('SPLIT', '나눠서 냄 (더치페이)', '나눠서 냄', {
            isWide: true,
            buttonTitle: '나눠서 냈다고 답하기',
            result: {
                message: [
                    { text: '내 몫만', isBold: true },
                    { text: ' 쓴 돈으로 치고\n나머지는 들어올 돈으로 기다려요', isBold: false },
                ],
                block: { ...LIVING, fillRate: 61 },
            },
        }),
    ],
};

const CATEGORY_BY_CODE: Record<string, string> = {
    DAILY_NECESSITIES: '생활/생필품',
    FOOD: '식비',
    CLOTHING: '의류',
    ETC: '기타',
    SPLIT: '나눠서 냄',
};

const sumSpent = (items: MockTransaction[]) =>
    items
        .filter(({ direction }) => direction === 'OUT')
        .reduce((sum, { amount }) => sum + amount, 0);

/** 시안의 쓴 돈 중 목업 목록에 없는 이전 거래 몫. 목록 합계에 더해 유지·삭제·빠른 입력이 합계에 반영되게 한다. */
const UNLISTED_SPENT = MOCK_TOTAL_SPENT - sumSpent(createTransactions());

let transactions = createTransactions();
let pendingQuestion: ContextQuestion | null = QUESTION;

const findTransaction = (transactionId: number) => {
    const target = transactions.find((item) => item.transactionId === transactionId);
    if (!target) {
        throw new ApiError('TRANSACTION_404', '거래를 찾을 수 없어요.', 404);
    }
    return target;
};

const lastDayOfMonth = (month: string) => {
    const [year, monthNumber] = month.split('-').map(Number);
    return new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
};

export function getTransactionListMock(
    params: TransactionListParams,
    cursor: string | null,
): TransactionListPage {
    const month = params.month ?? MOCK_MONTH;
    const isCurrentMonth = month === MOCK_MONTH;
    // 빠른 입력은 지난달 날짜로도 넣을 수 있으니 거래 날짜로 고른다.
    const inMonth = transactions.filter((item) => item.occurredAt.startsWith(month));

    // 계좌·블록은 합계까지 바꾸고, 상태 칩은 목록만 거른다.
    const scoped = inMonth.filter(
        (item) =>
            (params.accountId === null || item.linkedAccountId === params.accountId) &&
            (params.blockId === null || item.block?.blockId === params.blockId),
    );
    const listed = scoped.filter(
        (item) => params.status === 'ALL' || item.status === params.status,
    );

    const isScoped = params.accountId !== null || params.blockId !== null;
    const spentAmount = sumSpent(scoped) + (!isScoped && isCurrentMonth ? UNLISTED_SPENT : 0);

    // 날짜별로 묶는다. 블록 배분은 상태·계좌 필터가 없을 때만 보여준다.
    const byDate = new Map<string, MockTransaction[]>();
    listed
        .slice()
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
        .forEach((item) => {
            const date = item.occurredAt.slice(0, 10);
            byDate.set(date, [...(byDate.get(date) ?? []), item]);
        });
    const showAllocation = isCurrentMonth && params.status === 'ALL' && !isScoped;
    if (showAllocation) {
        Object.keys(ALLOCATIONS).forEach((date) => {
            if (!byDate.has(date)) byDate.set(date, []);
        });
    }

    const allDays: TransactionDay[] = [...byDate.entries()]
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, items]) => ({
            date,
            dayTotal: items
                .filter((item) => item.direction === 'OUT')
                .reduce((sum, item) => sum + item.amount, 0),
            // 목업 안에서만 쓰는 값은 빼고 보낸다.
            transactions: items.map(({ linkedAccountId: _omit, ...item }) => item),
            allocation: showAllocation ? (ALLOCATIONS[date] ?? null) : null,
        }));

    const start = cursor === null ? 0 : Number(cursor);
    const end = start + DAYS_PER_PAGE;

    return {
        period: {
            month,
            startDate: `${month}-01`,
            endDate: isCurrentMonth ? MOCK_TODAY : `${month}-${lastDayOfMonth(month)}`,
            today: MOCK_TODAY,
            isCurrentMonth,
        },
        summary: {
            spentAmount,
            pendingCount: scoped.filter(({ status }) => status === 'PENDING').length,
            incomeAmount: 0,
            nextExpectedIncome: isCurrentMonth
                ? { label: '월급', expectedDate: '2026-10-25' }
                : null,
        },
        counts: {
            needsReview: scoped.filter(({ status }) => status === 'NEEDS_REVIEW').length,
            pending: scoped.filter(({ status }) => status === 'PENDING').length,
        },
        agentQuestion: isCurrentMonth ? pendingQuestion : null,
        filterOptions: FILTER_OPTIONS,
        days: allDays.slice(start, end),
        nextCursor: end < allDays.length ? String(end) : null,
    };
}

export function answerQuestionMock({ questionId, optionCode, freeText }: AnswerQuestionRequest) {
    if (!pendingQuestion || pendingQuestion.questionId !== questionId) {
        throw new ApiError('QUESTION_404', '이미 답한 질문이에요.', 404);
    }
    const target = findTransaction(pendingQuestion.transactionId);
    // 직접 적은 내용은 서버가 분류한다. 목업은 기타로 둔다.
    target.categoryName = optionCode
        ? (CATEGORY_BY_CODE[optionCode] ?? '기타')
        : freeText
          ? '기타'
          : null;
    target.isCategoryGuess = false;
    target.status = 'CONFIRMED';
    target.review = null;
    pendingQuestion = null;
    return null;
}

/** 직접 넣은 거래를 그대로 둔다. */
export function keepTransactionMock(transactionId: number) {
    const target = findTransaction(transactionId);
    target.status = 'CONFIRMED';
    target.review = null;
    return null;
}

export function deleteTransactionMock(transactionId: number) {
    findTransaction(transactionId);
    transactions = transactions.filter((item) => item.transactionId !== transactionId);
    return null;
}

/** 빠른 입력 목업: 낱말로 분류를 짐작한다. (실제로는 서버가 나눈다) */
const QUICK_INPUT_CATEGORIES: [RegExp, string][] = [
    [/붕어빵|커피|카페|간식|빵/, '카페/간식'],
    [/점심|저녁|아침|밥|식당|김밥/, '식비'],
    [/택시|버스|지하철|교통/, '교통'],
    [/약국|병원/, '의료'],
    [/편의점/, '편의점'],
];

const QUICK_INPUT_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** MOCK_TODAY에서 days일 전 (yyyy-MM-dd) */
const daysBeforeToday = (days: number) => {
    const [year, month, day] = MOCK_TODAY.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day - days)).toISOString().slice(0, 10);
};

/**
 * '붕어빵 3000', '어제 택시 12000', '월요일 약국 6500'을 나눈다.
 * 숫자는 금액, 오늘·어제·○요일은 날짜, 나머지는 내용으로 본다.
 */
export function previewQuickInputMock(text: string): QuickInputPreview {
    let amount: number | null = null;
    let date = MOCK_TODAY;
    const words: string[] = [];

    text.trim()
        .split(/\s+/)
        .forEach((word) => {
            const amountMatch = /^(\d[\d,]*)원?$/.exec(word);
            const weekdayMatch = /^([일월화수목금토])요일$/.exec(word);
            if (amountMatch) {
                amount = Number(amountMatch[1].replace(/,/g, ''));
            } else if (word === '어제') {
                date = daysBeforeToday(1);
            } else if (word === '오늘') {
                date = MOCK_TODAY;
            } else if (weekdayMatch) {
                // 지난 ○요일 (오늘이 그 요일이면 오늘)
                const todayWeekday = new Date(`${MOCK_TODAY}T00:00:00Z`).getUTCDay();
                const target = QUICK_INPUT_WEEKDAYS.indexOf(weekdayMatch[1]);
                date = daysBeforeToday((todayWeekday - target + 7) % 7);
            } else if (word !== '') {
                words.push(word);
            }
        });

    const memo = words.join(' ') || null;
    const categoryName =
        QUICK_INPUT_CATEGORIES.find(([pattern]) => memo && pattern.test(memo))?.[1] ??
        (memo ? '기타' : null);

    return {
        amount,
        memo,
        date,
        today: MOCK_TODAY,
        categoryName,
        block: { ...LIVING, isDefault: true },
        blockOptions: FILTER_OPTIONS.blocks.map((block) => ({
            ...block,
            isDefault: block.blockId === LIVING.blockId,
        })),
    };
}

/** 빠른 입력 저장: 현금 지출이라 바로 확정된다. */
export function createQuickInputMock({
    amount,
    memo,
    date,
    categoryName,
    blockId,
}: CreateQuickInputRequest) {
    const block = FILTER_OPTIONS.blocks.find((item) => item.blockId === blockId) ?? LIVING;
    const transactionId = Math.max(0, ...transactions.map((item) => item.transactionId)) + 1;
    transactions = [
        ...transactions,
        {
            ...base,
            transactionId,
            occurredAt: `${date}T12:00:00`,
            amount,
            merchantOrPayee: memo,
            categoryName,
            paymentMethod: 'CASH',
            isQuickInput: true,
            block,
            linkedAccountId: null,
        },
    ];
    return null;
}
