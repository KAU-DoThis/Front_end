import { request } from '@/lib/apiClient';
import { queryClient } from '@/lib/queryClient';
import { ApiError } from '@/shared/types/api';
import { USE_MOCK } from '@/lib/mock';

import { blockKeys } from '@/features/block/api/blockKeys';

import type { SpendingAnalysis } from '@/features/transaction/types/spendingAnalysis';
import type { SpendingAnalysisResponse } from '@/features/transaction/types/spendingAnalysisResponse';
import type {
    AnswerQuestionRequest,
    CreateQuickInputRequest,
    QuickInputPreview,
    TransactionListPage,
    TransactionListParams,
} from '@/features/transaction/types/transaction';
import {
    TRANSACTION_ERROR_CODE,
    type CategoryResponse,
    type ManualPreviewResponse,
    type ManualSaveRequest,
    type TransactionBlockSourceResponse,
    type TransactionListResponse,
    type TransactionResponse,
    type TransactionReviewRequest,
    type UpdateTransactionCategoryRequest,
} from '@/features/transaction/types/transactionResponse';

import { getSpendingAnalysisMock } from './spendingAnalysisMock';
import { toSpendingAnalysis } from './spendingAnalysisMapper';
import {
    toQuickInputPreview,
    toTransactionListPage,
    toTransactionListQuery,
    todayInKorea,
} from './transactionMapper';
import {
    answerQuestionMock,
    createQuickInputMock,
    deleteTransactionMock,
    getTransactionListMock,
    keepTransactionMock,
    previewQuickInputMock,
} from './transactionMock';

/** 목업 응답 지연 (로딩 상태 확인용) */
const MOCK_DELAY_MS = 300;

/** 목업 값이 바뀌어도 TanStack Query가 알아채도록 매번 복사해서 준다. */
function mockResponse<T>(create: () => T): Promise<T> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                resolve(JSON.parse(JSON.stringify(create())) as T);
            } catch (error) {
                reject(error);
            }
        }, MOCK_DELAY_MS);
    });
}

/**
 * 거래 목록 (09 · 09-2). page는 0부터 센다.
 * 목업 모드(USE_MOCK)에서는 목업을 쓴다. 서버 응답은 transactionMapper로 화면 모양으로 바꾼다.
 */
export const getTransactionList = async (
    params: TransactionListParams,
    page: number,
): Promise<TransactionListPage> => {
    if (USE_MOCK) {
        return mockResponse(() => getTransactionListMock(params, page));
    }
    const [response, blocks] = await Promise.all([
        request<TransactionListResponse>({
            method: 'GET',
            url: '/transactions',
            params: toTransactionListQuery(params, page),
        }),
        // 블록 목록은 점 색·블록 필터에만 쓴다. 받지 못해도 거래 목록은 보여준다. (점은 기본 색)
        getBlocksForTransactions().catch(() => []),
    ]);
    return toTransactionListPage(response, blocks);
};

/**
 * 거래 화면에서 쓰는 블록 목록 (GET /blocks). 거래 응답의 블록에는 이름만 있어서 점 색·상태와 블록 필터 목록을 여기서 채운다.
 * TODO: 거래 응답의 블록에 색·상태가 오면 목록 조회는 블록 필터에만 쓴다.
 */
const getBlocksForTransactions = () =>
    // 페이지·미리보기마다 다시 받지 않도록 캐시를 같이 쓴다. (기본 staleTime 동안 재사용, 블록이 바뀌면 blockKeys.all로 무효화)
    queryClient.fetchQuery({
        queryKey: blockKeys.list(),
        queryFn: async () => {
            const { blocks } = await request<{ blocks: TransactionBlockSourceResponse[] }>({
                method: 'GET',
                url: '/blocks',
            });
            return blocks;
        },
    });

/**
 * 거래 하나. 없으면 TRANSACTION_NOT_FOUND(404), 다른 사용자 거래면 TRANSACTION_FORBIDDEN(403)
 * TODO: 거래 상세 화면이 생기면 쓴다.
 */
export const getTransaction = (transactionId: number) =>
    request<TransactionResponse>({ method: 'GET', url: `/transactions/${transactionId}` });

/**
 * 거래 카테고리를 바꾼다. 응답은 바뀐 거래 (classifiedBy가 USER, categoryUncertain은 false)
 * 없는 카테고리면 TRANSACTION_CATEGORY_NOT_FOUND(404)
 * TODO: 카테고리 바꾸기 화면이 생기면 쓴다.
 */
export const updateTransactionCategory = (
    transactionId: number,
    body: UpdateTransactionCategoryRequest,
) =>
    request<TransactionResponse>({
        method: 'PATCH',
        url: `/transactions/${transactionId}/category`,
        data: body,
    });

/** 카테고리 목록 (표시 순서). type을 빼면 16개 전부 */
export const getCategories = (type?: CategoryResponse['type']) =>
    request<CategoryResponse[]>({ method: 'GET', url: '/categories', params: { type } });

/** 소비 분석 (11). month(yyyy-MM)가 null이면 이번 달. 목업 모드에서는 목업을 쓴다. */
export const getSpendingAnalysis = async (month: string | null): Promise<SpendingAnalysis> => {
    if (USE_MOCK) {
        return mockResponse(() => getSpendingAnalysisMock(month));
    }
    const response = await request<SpendingAnalysisResponse>({
        method: 'GET',
        url: '/analysis/spending',
        params: month ? { month } : undefined,
    });
    return toSpendingAnalysis(response, todayInKorea());
};

// TODO: 맥락 질문은 서버에 아직 없어 목업만 쓴다.

/**
 * 에이전트 질문에 답한다. (09-1)
 * request<null>({ method: 'POST', url: `/transactions/questions/${questionId}/answer`, data })
 */
export const answerQuestion = (body: AnswerQuestionRequest): Promise<null> =>
    mockResponse(() => answerQuestionMock(body));

// 아래는 서버에 있는 API다. 목업 모드(USE_MOCK)에서는 목업을 쓴다.

/** 확인 필요 거래 처리 (PATCH /transactions/{transactionId}/review) */
const reviewTransaction = (transactionId: number, action: TransactionReviewRequest['action']) =>
    request<unknown>({
        method: 'PATCH',
        url: `/transactions/${transactionId}/review`,
        data: { action } satisfies TransactionReviewRequest,
    });

/** 확인 필요 거래를 맞는 거래로 유지한다. 확인 필요 상태가 아니면 TRANSACTION_NOT_REVIEWABLE(409) */
export const keepTransaction = async (transactionId: number): Promise<null> => {
    if (USE_MOCK) {
        return mockResponse(() => keepTransactionMock(transactionId));
    }
    await reviewTransaction(transactionId, 'KEEP');
    return null;
};

/** 확인 필요 거래를 지운다. 서버가 블록 잔액을 되돌린다. */
export const deleteTransaction = async (transactionId: number): Promise<null> => {
    if (USE_MOCK) {
        return mockResponse(() => deleteTransactionMock(transactionId));
    }
    await reviewTransaction(transactionId, 'DELETE');
    return null;
};

/**
 * 빠른 입력 (10): 한 줄로 적은 내용을 금액·내용·날짜·분류·블록으로 나눠 미리 보여준다. 저장하지 않는다.
 * 금액을 못 읽으면 서버가 MANUAL_PARSE_FAILED(400)를 주는데, 화면은 금액 없는 미리보기로 보여준다.
 */
export const previewQuickInput = async (text: string): Promise<QuickInputPreview> => {
    if (USE_MOCK) {
        return mockResponse(() => previewQuickInputMock(text));
    }
    const [response, blocks] = await Promise.all([
        request<ManualPreviewResponse>({
            method: 'POST',
            url: '/transactions/manual/preview',
            data: { text },
        }).catch((error: unknown) => {
            if (
                error instanceof ApiError &&
                error.code === TRANSACTION_ERROR_CODE.MANUAL_PARSE_FAILED
            ) {
                return null;
            }
            throw error;
        }),
        getBlocksForTransactions(),
    ]);
    const preview = toQuickInputPreview(response, blocks);
    if (!preview) {
        throw new ApiError('NO_BLOCK', '먼저 블록을 만들어 주세요');
    }
    return preview;
};

/**
 * 빠른 입력 (10): 현금 지출을 저장한다. 바로 확정 거래가 되고 서버가 분류로 정한 블록에서 뺀다.
 * 서버는 블록을 따로 받지 않는다. (blockId는 목업에서만 쓴다)
 */
export const createQuickInput = async (body: CreateQuickInputRequest): Promise<null> => {
    if (USE_MOCK) {
        return mockResponse(() => createQuickInputMock(body));
    }
    await request<unknown>({
        method: 'POST',
        url: '/transactions/manual',
        data: {
            amount: body.amount,
            description: body.memo,
            occurredDate: body.date,
            categoryId: body.categoryId,
        } satisfies ManualSaveRequest,
    });
    return null;
};
