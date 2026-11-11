/**
 * 거래 API 서버 응답·요청 모양 (Back_end dev DTO 기준, API 명세 v4 4장)
 * 화면은 이 타입을 바로 쓰지 않고 transactionMapper로 transaction.ts 모양으로 바꿔서 쓴다.
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

/** 거래에 붙는 카테고리 (Back_end TransactionResponse.CategoryItem) */
export interface TransactionCategoryResponse {
    categoryId: number;
    code: string;
    name: string;
}

/** 거래가 나간 계좌·카드 (Back_end TransactionResponse.AccountItem) */
export interface TransactionAccountResponse {
    linkedAccountId: number;
    institutionName: string;
    /** 계좌·카드 번호 뒤 4자리 */
    last4: string | null;
}

/** 거래가 반영된 블록 (Back_end TransactionResponse.BlockItem). 색·상태는 없어서 블록 목록에서 채운다. */
export interface TransactionBlockResponse {
    blockId: number;
    name: string;
}

/** 거래 객체 (Back_end TransactionResponse, API 명세 v4 0장) */
export interface TransactionResponse {
    transactionId: number;
    /** 현금 빠른 입력은 null */
    linkedAccount: TransactionAccountResponse | null;
    /** 오프셋 없는 한국 시간 */
    occurredAt: string;
    /** 양수 금액 */
    amount: number;
    direction: 'IN' | 'OUT';
    merchantOrPayee: string | null;
    /** CODEF: 연동 거래 · NOTIFICATION: 결제 알림 · MANUAL: 빠른 입력 */
    source: 'CODEF' | 'NOTIFICATION' | 'MANUAL';
    status: 'CONFIRMED' | 'PROVISIONAL' | 'NEEDS_REVIEW';
    /** 분류 전이면 null */
    category: TransactionCategoryResponse | null;
    /** true면 이름 뒤에 ?를 붙인다. (자동 분류 신뢰도 0.7 미만, 임시 기준) */
    categoryUncertain: boolean;
    /** 사용자가 바꾸면 USER */
    classifiedBy: string | null;
    contextTag: string | null;
    /** 맥락 답변 표시용 (태그 목록 확정 전까지 null) */
    contextTagLabel: string | null;
    /** 블록 반영 전이면 null */
    block: TransactionBlockResponse | null;
    /** 체크카드 결제의 은행 쪽처럼 쓴 돈에서 뺀 거래. 목록에는 보이지만 흐리게 보여준다. */
    excluded: boolean;
    isCanceled: boolean;
    /** 빠른 입력이면 "빠른 입력" */
    inputMethod: string | null;
}

/** 날짜 묶음 안의 한 줄. 거래이거나 블록 배분 기록이다. */
export interface TransactionListItemResponse {
    kind: 'TRANSACTION' | 'ALLOCATION';
    /** kind가 TRANSACTION일 때 */
    transaction: TransactionResponse | null;
    /** 거래 아래 안내 문장. 없으면 null */
    notice: string | null;
    /** 확인 필요 거래의 선택지 (KEEP, DELETE). 없으면 null */
    reviewActions: ('KEEP' | 'DELETE')[] | null;
    /** kind가 ALLOCATION일 때 */
    allocation: { title: string; blockCount: number; note: string | null } | null;
}

export interface TransactionDayResponse {
    /** yyyy-MM-dd. 같은 날짜가 두 페이지에 걸쳐 올 수 있다. */
    date: string;
    /** 그날 쓴 돈(출금 합계, 양수). 페이지가 아니라 그날 전체 기준이다. */
    dayTotal: number;
    items: TransactionListItemResponse[];
}

/** GET /transactions 응답 */
export interface TransactionListResponse {
    /** 계좌·블록만 걸린다. (filter와 상관없다) */
    summary: {
        /** yyyy-MM-dd. 이번 달이면 to는 오늘, 지난달이면 말일 */
        period: { from: string; to: string };
        /** 기간 내 쓴 돈 (소비 제외·취소 거래 제외) */
        spent: number;
        /** 쓴 돈에 들어간 임시 거래 수 */
        provisionalCount: number;
        /** 기간 내 들어온 돈 */
        income: number;
        /** 입금원 분석 전까지 null */
        nextExpectedIncome: { label: string; expectedDate: string } | null;
        /** linkedAccountId를 줬을 때만 있다. */
        account: TransactionAccountResponse | null;
    };
    /** 가장 최근 미답변 맥락 질문 (맥락 질문 기능 전까지 null) */
    pendingQuestion: { questionId: number; text: string; subText: string | null } | null;
    /** 계좌·블록만 걸린다. */
    counts: { needsReview: number; provisional: number };
    /** 계좌·블록·filter가 모두 걸린다. */
    days: TransactionDayResponse[];
    hasNext: boolean;
}

/** PATCH /transactions/{transactionId}/category 요청 */
export interface UpdateTransactionCategoryRequest {
    categoryId: number;
}

/** PATCH /transactions/{transactionId}/review 요청 (확인 필요 거래 처리) */
export interface TransactionReviewRequest {
    /** KEEP: 맞는 거래로 유지, DELETE: 삭제하고 블록 잔액 복구 */
    action: 'KEEP' | 'DELETE';
}

/** POST /transactions/manual/preview 응답 (빠른 입력 미리보기, 저장하지 않음) */
export interface ManualPreviewResponse {
    amount: number;
    /** 금액만 입력했으면 null */
    description: string | null;
    /** yyyy-MM-dd */
    occurredDate: string;
    /** AI 해석 전이라 지금은 null */
    category: TransactionCategoryResponse | null;
    /** 차감될 블록. 고를 블록이 없으면 null */
    block: { blockId: number; name: string; isDefault: boolean } | null;
}

/** POST /transactions/manual 요청 (빠른 입력 저장) */
export interface ManualSaveRequest {
    amount: number;
    description: string | null;
    /** yyyy-MM-dd, 오늘이나 과거만 */
    occurredDate: string;
    /** 비우면 기본 생활비 블록에서 뺀다 */
    categoryId: number | null;
}

/** 거래 화면에서 블록 색·상태를 채우는 데 쓰는 블록 (GET /blocks의 블록 객체 일부) */
export interface TransactionBlockSourceResponse {
    blockId: number;
    name: string;
    /** 서버는 대문자(I·O·T·S·Z·J·L) */
    color: string;
    status: string;
    isDefault: boolean;
}

/** 빠른 입력·확인 필요 처리 에러 코드 — 화면 분기는 ApiError.code로 한다. */
export const TRANSACTION_ERROR_CODE = {
    /** 빠른 입력 문장에서 금액을 못 읽음 */
    MANUAL_PARSE_FAILED: 'MANUAL_PARSE_FAILED',
    /** 확인 필요 상태가 아닌 거래를 유지·삭제하려 함 */
    NOT_REVIEWABLE: 'TRANSACTION_NOT_REVIEWABLE',
} as const;
