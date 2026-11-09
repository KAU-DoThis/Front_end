import { request } from '@/lib/apiClient';
import { USE_MOCK } from '@/lib/mock';

import type { SpendingAnalysis } from '@/features/transaction/types/spendingAnalysis';
import type {
    AnswerQuestionRequest,
    CreateQuickInputRequest,
    QuickInputPreview,
    TransactionListPage,
    TransactionListParams,
} from '@/features/transaction/types/transaction';
import type {
    CategoryResponse,
    TransactionListResponse,
    TransactionResponse,
    UpdateTransactionCategoryRequest,
} from '@/features/transaction/types/transactionResponse';

import { getSpendingAnalysisMock } from './spendingAnalysisMock';
import { toTransactionListPage, toTransactionListQuery } from './transactionMapper';
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
    const response = await request<TransactionListResponse>({
        method: 'GET',
        url: '/transactions',
        params: toTransactionListQuery(params, page),
    });
    return toTransactionListPage(response);
};

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

// TODO: 아래 API는 아직 명세가 없다. 정해지면 주석처럼 바꾼다. (URL은 지금은 가정값, 화면·훅은 그대로)

/**
 * 소비 분석 (11)
 * request<SpendingAnalysis>({ method: 'GET', url: '/transactions/analysis', params: { month } })
 */
export const getSpendingAnalysis = (month: string | null): Promise<SpendingAnalysis> =>
    mockResponse(() => getSpendingAnalysisMock(month));

/**
 * 에이전트 질문에 답한다. (09-1)
 * request<null>({ method: 'POST', url: `/transactions/questions/${questionId}/answer`, data })
 */
export const answerQuestion = (body: AnswerQuestionRequest): Promise<null> =>
    mockResponse(() => answerQuestionMock(body));

/**
 * 직접 넣은 거래가 카드 내역에 없을 때 그대로 둔다.
 * request<null>({ method: 'POST', url: `/transactions/${transactionId}/keep` })
 */
export const keepTransaction = (transactionId: number): Promise<null> =>
    mockResponse(() => keepTransactionMock(transactionId));

/**
 * 직접 넣은 거래를 지운다.
 * request<null>({ method: 'DELETE', url: `/transactions/${transactionId}` })
 */
export const deleteTransaction = (transactionId: number): Promise<null> =>
    mockResponse(() => deleteTransactionMock(transactionId));

/**
 * 빠른 입력 (10): 한 줄로 적은 내용을 금액·내용·날짜·분류·블록으로 나눠 미리 보여준다. 저장하지 않는다.
 * request<QuickInputPreview>({ method: 'POST', url: '/transactions/quick-input/preview', data: { text } })
 */
export const previewQuickInput = (text: string): Promise<QuickInputPreview> =>
    mockResponse(() => previewQuickInputMock(text));

/**
 * 빠른 입력 (10): 현금 지출을 저장한다. 카드 내역과 맞춰볼 필요가 없어 바로 확정된다.
 * request<null>({ method: 'POST', url: '/transactions/quick-input', data: body })
 */
export const createQuickInput = (body: CreateQuickInputRequest): Promise<null> =>
    mockResponse(() => createQuickInputMock(body));
