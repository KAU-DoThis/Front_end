import { request } from '@/lib/apiClient';

import type {
    SavingGoalCreateRequest,
    SavingGoalDraft,
    SavingOverview,
    SavingSuggestionList,
} from '@/features/goal/types/saving';

import {
    createSavingGoalMock,
    dismissSuggestionMock,
    getSavingGoalDraftMock,
    getSavingOverviewMock,
    getSavingSuggestionsMock,
    includeExcludedSpendingMock,
} from './savingMock';

/**
 * 절약 API가 아직 서버에 없어서, 목업 모드가 아니어도 항상 목업으로 처리한다.
 * TODO: 서버에 API가 생기면 USE_MOCK(@/lib/mock)으로 바꾸고, 요청 body를 명세와 다시 맞춘다.
 */
const USE_SAVING_MOCK = true;

const MOCK_DELAY_MS = 300;

/** 로딩 상태도 확인할 수 있게 약간 지연한다. */
function mockResponse<T>(create: () => T): Promise<T> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                resolve(create());
            } catch (error) {
                reject(error);
            }
        }, MOCK_DELAY_MS);
    });
}

/** 절약 화면 요약 (확정 절약분 · 진행 중인 목표 · 후보 개수) */
export const getSavingOverview = (): Promise<SavingOverview> => {
    if (USE_SAVING_MOCK) {
        return mockResponse(getSavingOverviewMock);
    }
    return request<SavingOverview>({ method: 'GET', url: '/savings/overview' });
};

/** 줄일 수 있는 지출(절약 후보)과 후보에서 뺀 지출 */
export const getSavingSuggestions = (): Promise<SavingSuggestionList> => {
    if (USE_SAVING_MOCK) {
        return mockResponse(getSavingSuggestionsMock);
    }
    return request<SavingSuggestionList>({ method: 'GET', url: '/savings/suggestions' });
};

/**
 * 절약 후보 관심 없음
 * TODO: 명세에 body가 없어 가정값이다. 서버 API가 나오면 맞춘다.
 */
export const dismissSavingSuggestion = (suggestionId: number): Promise<null> => {
    if (USE_SAVING_MOCK) {
        return mockResponse(() => {
            dismissSuggestionMock(suggestionId);
            return null;
        });
    }
    return request<null>({
        method: 'PATCH',
        url: `/savings/suggestions/${suggestionId}`,
        data: { status: 'DISMISSED' },
    });
};

/**
 * 후보에서 뺀 지출 다시 포함. 묶인 거래마다 제외를 푼다.
 * TODO: 명세에 body가 없어 가정값이다. 서버 API가 나오면 맞춘다.
 */
export const includeExcludedSpending = async (transactionIds: number[]): Promise<null> => {
    if (USE_SAVING_MOCK) {
        return mockResponse(() => {
            includeExcludedSpendingMock(transactionIds);
            return null;
        });
    }
    await Promise.all(
        transactionIds.map((transactionId) =>
            request<null>({
                method: 'PATCH',
                url: `/transactions/${transactionId}/saving-exclusion`,
                data: { excluded: false },
            }),
        ),
    );
    return null;
};

/**
 * 절약 목표 설정 시트(12) 초기값 — 기준 지출액, 제안 목표, 기간, 고를 수 있는 목표 블록
 * TODO: 명세에 응답 모양이 없어 가정값이다. 서버 API가 나오면 맞춘다.
 */
export const getSavingGoalDraft = (suggestionId: number): Promise<SavingGoalDraft> => {
    if (USE_SAVING_MOCK) {
        return mockResponse(() => getSavingGoalDraftMock(suggestionId));
    }
    return request<SavingGoalDraft>({
        method: 'GET',
        url: '/saving-goals/draft',
        params: { suggestionId },
    });
};

/**
 * 절약 목표 시작하기
 * TODO: 명세에 body가 없어 가정값이다. 서버 API가 나오면 맞춘다.
 */
export const createSavingGoal = (body: SavingGoalCreateRequest): Promise<null> => {
    if (USE_SAVING_MOCK) {
        return mockResponse(() => {
            createSavingGoalMock(body);
            return null;
        });
    }
    return request<null>({ method: 'POST', url: '/saving-goals', data: body });
};
