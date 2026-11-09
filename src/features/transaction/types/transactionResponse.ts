/**
 * 거래 API 서버 응답·요청 모양 (백엔드 안내 기준)
 * 화면은 이 타입을 바로 쓰지 않고 transactionMapper로 transaction.ts 모양으로 바꿔서 쓴다.
 *
 * TODO: 안내에 이름이 나오지 않은 필드는 가정값이다. API 명세 v4 0장 TransactionResponse · Swagger로 맞춘다.
 *       (occurredAt · amount · direction · merchantName · paymentMethod · status · days[].transactions · counts 이름)
 */

/** 목록 필터. 임시 거래는 서버에서 PROVISIONAL이다. */
export type TransactionFilterParam = 'ALL' | 'NEEDS_REVIEW' | 'PROVISIONAL';

/** GET /transactions 쿼리 */
export interface TransactionListQuery {
    /** yyyy-MM (빼면 이번 달) */
    month?: string;
    linkedAccountId?: number;
    blockId?: number;
    filter: TransactionFilterParam;
    page: number;
    /** 최대 100 */
    size: number;
}

/** GET /categories 항목 (표시 순서대로 온다) */
export interface CategoryResponse {
    categoryId: number;
    code: string;
    name: string;
    /** EXPENSE: 소비 12개 · TRANSFER: 이체 유형 4개 */
    type: 'EXPENSE' | 'TRANSFER';
}

/** 거래가 반영된 블록 (블록 반영(F-21) 전까지 항상 null) */
export interface TransactionBlockResponse {
    blockId: number;
    name: string;
    // TODO: 색·상태 필드 이름은 명세로 맞춘다.
    color: string | null;
    status: string | null;
}

/** 거래 객체 (API 명세 v4 0장 TransactionResponse) */
export interface TransactionResponse {
    transactionId: number;
    /** ISO 8601 */
    occurredAt: string;
    /** 양수 금액 */
    amount: number;
    direction: 'IN' | 'OUT';
    merchantName: string | null;
    paymentMethod: 'CARD' | 'ACCOUNT' | 'CASH' | null;
    status: 'CONFIRMED' | 'PROVISIONAL' | 'NEEDS_REVIEW';
    /** 대부분 null (AI 분류 연동 전) */
    category: CategoryResponse | null;
    /** true면 이름 뒤에 ?를 붙인다. (자동 분류 신뢰도 0.7 미만, 임시 기준) */
    categoryUncertain: boolean;
    /** 사용자가 바꾸면 USER */
    classifiedBy: string | null;
    /** 빠른 입력 거래일 때만 "빠른 입력" */
    inputMethod: string | null;
    /** 맥락 태그 (목록 확정 전까지 null) */
    contextTagLabel: string | null;
    block: TransactionBlockResponse | null;
    /** 체크카드 결제의 은행 쪽처럼 쓴 돈에서 뺀 거래. 목록에는 보이지만 흐리게 보여준다. */
    excluded: boolean;
    // TODO: 확인 필요 처리·빠른 입력이 붙으면 모양을 맞춘다. (지금은 null)
    notice: string | null;
    reviewActions: string[] | null;
}

export interface TransactionDayResponse {
    /** yyyy-MM-dd. 같은 날짜가 두 페이지에 걸쳐 올 수 있다. */
    date: string;
    /** 그날 쓴 돈(출금 합계, 양수). 페이지가 아니라 그날 전체 기준이다. */
    dayTotal: number;
    transactions: TransactionResponse[];
}

/** GET /transactions 응답 */
export interface TransactionListResponse {
    /** 계좌·블록만 걸린다. (filter와 상관없다) */
    summary: {
        /** 이번 달 쓴 돈 */
        spent: number;
        /** 이번 달 들어온 돈 */
        income: number;
        /** yyyy-MM-dd. 이번 달이면 to는 오늘, 지난달이면 말일 */
        period: { from: string; to: string };
        /** linkedAccountId를 줬을 때만 있다. */
        account: { linkedAccountId: number; institutionName: string; label: string } | null;
        /** 입금원 분석 전까지 null */
        nextExpectedIncome: { label: string; expectedDate: string } | null;
    };
    /** 계좌·블록만 걸린다. */
    counts: { needsReview: number; provisional: number };
    /** 맥락 질문 API 전까지 null */
    pendingQuestion: null;
    /** 계좌·블록·filter가 모두 걸린다. */
    days: TransactionDayResponse[];
    hasNext: boolean;
}

/** PATCH /transactions/{transactionId}/category 요청 */
export interface UpdateTransactionCategoryRequest {
    categoryId: number;
}
