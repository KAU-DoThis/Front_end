import type { BlockColor } from '@/shared/components/ui/BlockBeaker';
import type { Status } from '@/shared/components/ui/StatusTag';

// 화면에서 쓰는 거래 모양. 서버 응답(transactionResponse.ts)은 transactionMapper에서 이 모양으로 바꾼다.
// TODO: 맥락 질문 · 빠른 입력 · 배분 기록은 API가 나오면 맞춘다. (지금은 시안 09 · 09-1 · 10 기준 가정값)

/** 일부를 굵게 보여주는 서버 문장 (예: [네이버페이 38,000원](굵게) + , 무엇을 샀는지 알려줄래요?) */
export type RichText = { text: string; isBold: boolean }[];

/**
 * 거래 상태
 * - CONFIRMED: 확정
 * - PENDING: 임시 (빠른 입력으로 넣고 카드 내역을 기다리는 중, 서버 값은 PROVISIONAL)
 * - NEEDS_REVIEW: 확인 필요 (분류를 묻거나, 직접 넣은 거래가 카드 내역에 없을 때)
 */
export type TransactionStatus = 'CONFIRMED' | 'PENDING' | 'NEEDS_REVIEW';

/** 내역 탭 안의 거래 목록 / 소비 분석 */
export type TransactionTab = 'LIST' | 'ANALYSIS';

/** 거래 목록 상단 칩 필터 (블록·계좌는 따로 고른다) */
export type TransactionStatusFilter = 'ALL' | 'NEEDS_REVIEW' | 'PENDING';

/**
 * 확인이 필요한 이유
 * - CATEGORY_QUESTION: 무엇을 샀는지 묻는다. 에이전트 질문 시트(09-1)로 답한다.
 * - UNMATCHED_MANUAL: 직접 넣은 거래가 카드 내역에 없다. 유지·삭제로 답한다.
 */
export type TransactionReview =
    | { type: 'CATEGORY_QUESTION'; questionId: number }
    | { type: 'UNMATCHED_MANUAL'; message: string };

/** 거래가 걸린 블록 (점 색 · 이름) */
export interface TransactionBlock {
    blockId: number;
    name: string;
    color: BlockColor;
    status: Status;
}

export interface TransactionItem {
    transactionId: number;
    /** ISO 8601 */
    occurredAt: string;
    /** 양수 금액 — 방향은 direction으로 본다. */
    amount: number;
    direction: 'IN' | 'OUT';
    merchantOrPayee: string | null;
    /** 분류 (없으면 결제 수단을 보여준다) */
    categoryName: string | null;
    /** 분류를 서버가 짐작한 것이라 확인이 필요하면 true (예: 생필품?) */
    isCategoryGuess: boolean;
    /** 결제 수단 — 현금은 분류가 없을 때 "현금"으로 보여준다. */
    paymentMethod: 'CARD' | 'ACCOUNT' | 'CASH';
    /** 빠른 입력으로 직접 넣은 거래 */
    isQuickInput: boolean;
    /** 맥락 태그 (예: 야근) */
    contextTag: string | null;
    status: TransactionStatus;
    /** 확인 필요일 때만 있다. */
    review: TransactionReview | null;
    block: TransactionBlock | null;
    /** 쓴 돈에서 뺀 거래 (체크카드 결제의 은행 쪽 등). 목록에는 흐리게 보여준다. */
    isExcluded: boolean;
}

/** 블록 배분 기록 (앱 안에서만 나눈 돈이라 쓴 돈에 안 잡힌다) */
export interface BlockAllocationEntry {
    /** 예: 10월 블록 배분 */
    title: string;
    blockCount: number;
}

/** 하루치 거래 */
export interface TransactionDay {
    /** yyyy-MM-dd */
    date: string;
    /** 그날 쓴 돈 합계 (양수) — 서버 계산. 화면에서 앞에 -를 붙여 보여준다. */
    dayTotal: number;
    transactions: TransactionItem[];
    /** 그날 블록 배분이 있었으면 있다. */
    allocation: BlockAllocationEntry | null;
}

export interface TransactionPeriod {
    /** yyyy-MM */
    month: string;
    /** 이번 조회 기간 (yyyy-MM-dd). 이번 달이면 오늘까지다. */
    startDate: string;
    endDate: string;
    /** 서버 기준 오늘 (yyyy-MM-dd) — 오늘·어제 표시에 쓴다. */
    today: string;
    /** 이번 달이면 다음 달로 넘길 수 없다. */
    isCurrentMonth: boolean;
}

export interface TransactionSummary {
    spentAmount: number;
    /** 쓴 돈에 들어간 임시 거래 수 */
    pendingCount: number;
    incomeAmount: number;
    /** 다음 정기 입금 예정 (없으면 null) */
    nextExpectedIncome: { label: string; expectedDate: string } | null;
}

/** 에이전트가 거래 맥락을 묻는 질문 (09 배너 · 09-1 시트) */
export interface ContextQuestion {
    questionId: number;
    transactionId: number;
    /** 배너 첫 줄 (예: 네이버페이 38,000원(굵게), 무엇을 샀는지 알려줄래요?) */
    bannerMessage: RichText;
    /** 시트 말풍선 (예: 어제 결제한 네이버페이 38,000원(굵게), 무엇을 샀어요?) */
    sheetMessage: RichText;
    /** ISO 8601 */
    occurredAt: string;
    /** 예: 신한카드 ••12 */
    accountLabel: string;
    options: ContextAnswerOption[];
}

export interface ContextAnswerOption {
    /** 서버에 보내는 값 */
    code: string;
    /** 예: 생필품 · 나눠서 냄 (더치페이) */
    label: string;
    /** 한 줄을 다 쓰는 선택지 (나눠서 냄) */
    isWide: boolean;
    /** 확정 버튼 문구 (예: 생필품으로 답하기) */
    buttonTitle: string;
    /** 이 답을 고르면 어떻게 바뀌는지 (예: 생활/생필품(굵게)으로 바꾸고 / 생활비 블록에 그대로 둬요) */
    result: { message: RichText; block: TransactionBlock & { fillRate: number } };
    /** 같은 답을 전에도 했으면 규칙으로 저장할지 묻는다. (없으면 null) */
    ruleSuggestion: RichText | null;
}

/** 필터로 고를 수 있는 블록 · 계좌 */
export interface TransactionFilterOptions {
    blocks: TransactionBlock[];
    accounts: { linkedAccountId: number; institutionName: string; label: string }[];
}

/** 거래 목록 조회 조건 */
export interface TransactionListParams {
    /** yyyy-MM (null이면 이번 달) */
    month: string | null;
    status: TransactionStatusFilter;
    blockId: number | null;
    accountId: number | null;
}

/**
 * 거래 목록 한 쪽 (이전 거래 더 보기로 이어서 받는다)
 * 페이지는 거래 단위라 같은 날짜가 두 쪽에 걸칠 수 있다. 화면에서 mergeTransactionDays로 이어 붙인다.
 */
export interface TransactionListPage {
    period: TransactionPeriod;
    /** 지금 조건(계좌 등)으로 계산한 합계 */
    summary: TransactionSummary;
    /** 확인 필요 · 임시 건수 (칩 숫자) */
    counts: { needsReview: number; pending: number };
    /** 지금 물어볼 질문 (없으면 null) */
    agentQuestion: ContextQuestion | null;
    /**
     * 블록·계좌 고르기에 쓰는 목록.
     * TODO: 거래 목록 API에는 없다. 블록 목록 · GET /linked-accounts에서 받을지 백엔드와 정한다. (지금은 빈 목록)
     */
    filterOptions: TransactionFilterOptions;
    days: TransactionDay[];
    /** 다음 쪽이 있으면 true */
    hasNext: boolean;
}

export interface AnswerQuestionRequest {
    questionId: number;
    /** 고른 선택지 (직접 적었으면 null) */
    optionCode: string | null;
    /** 직접 적은 내용 — 분류에만 쓰고 저장하지 않는다. */
    freeText: string | null;
    /** 다음부터 같은 답을 자동으로 적용 */
    saveRule: boolean;
}

// TODO: 빠른 입력 API 명세가 나오면 맞춘다. (지금은 시안 10 기준 가정값)
/** 빠른 입력에서 고를 수 있는 블록 */
export type QuickInputBlock = TransactionBlock & {
    /** 따로 고르지 않으면 넣는 블록 (예: 생활비) */
    isDefault: boolean;
};

/** 빠른 입력 (10): 한 줄로 적은 내용을 서버가 나눠 준 저장 미리보기 */
export interface QuickInputPreview {
    /** 적은 금액 (금액을 못 찾으면 null — 저장할 수 없다) */
    amount: number | null;
    /** 내용 (예: 붕어빵, 못 찾으면 null) */
    memo: string | null;
    /** 쓴 날 (yyyy-MM-dd). '어제' · '월요일'처럼 적으면 그날이다. */
    date: string;
    /** 서버 기준 오늘 (yyyy-MM-dd) — 오늘·어제 표시에 쓴다. */
    today: string;
    /** 서버가 짐작한 분류 (못 정하면 null) */
    categoryName: string | null;
    /** 넣을 블록 */
    block: QuickInputBlock;
    /** 블록 줄을 눌러 바꿀 수 있는 블록 */
    blockOptions: QuickInputBlock[];
}

export interface CreateQuickInputRequest {
    amount: number;
    memo: string | null;
    /** yyyy-MM-dd */
    date: string;
    categoryName: string | null;
    blockId: number;
}
