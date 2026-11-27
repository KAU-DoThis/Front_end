import type { HomeBlock } from '@/features/block/types/block';

// 16 목표 지키기 (F-08) 화면 모양. 목표형 블록이 목표일보다 늦어질 때 맞출 방법을 고른다.
// 문장·날짜·추천은 모두 서버가 정해 준다. 화면은 받은 그대로 그린다.
// TODO: 명세에 없는 API라 경로와 응답을 가정했다. 백엔드와 맞춘 뒤 고친다.

/**
 * 맞출 방법 종류
 * PUT_WAITING_FUND 절약분 넣기 · RAISE_MONTHLY 다른 블록에서 매달 더 넣기 ·
 * POSTPONE_DUE_DATE 목표일 미루기 · REDUCE_TARGET 목표 금액 줄이기
 */
export type GoalGuardOptionType =
    'PUT_WAITING_FUND' | 'RAISE_MONTHLY' | 'POSTPONE_DUE_DATE' | 'REDUCE_TARGET';

export interface GoalGuardOption {
    /** 반영할 때 그대로 보낸다. */
    optionId: string;
    type: GoalGuardOptionType;
    /** 예: 9월 절약분 50,000원 넣기 */
    title: string;
    /** 예: 배분 안 한 절약액에서 옮겨요 */
    description: string;
    /** 이 방법을 쓰면 다 모이는 날 (yyyy-MM-dd) */
    resultDate: string;
    /** 예: 목표일 맞춤 · 1주 빨라짐 · 새 목표일 */
    resultLabel: string;
    /** 에이전트 추천 (하나만, 처음에 골라 둔다) */
    isRecommended: boolean;
}

/** GET /blocks/{blockId}/goal-guard */
export interface GoalGuard {
    block: HomeBlock;
    targetAmount: number;
    /** 목표일 (yyyy-MM-dd) */
    dueDate: string;
    /** 지금 속도로 다 모이는 날 (yyyy-MM-dd) */
    expectedDate: string;
    /** 예: 1월 중순 */
    expectedLabel: string;
    /** 예: 지금 속도면 목표일보다 2주쯤 늦어요 */
    headline: string;
    /** 예: 이번 달 확보 금액이 120,000원 모자라요. 아래 방법 중 하나를 고르면 바로 반영할게요 */
    message: string;
    /** 이 블록에서 쓸 수 있는 방법만 온다. */
    options: GoalGuardOption[];
    /** 낙관적 잠금 버전 (블록 상세와 같은 값). 반영 요청에 그대로 보낸다. */
    version: number;
}

/** POST /blocks/{blockId}/goal-guard */
export interface ApplyGoalGuardRequest {
    optionId: string;
    version: number;
}

/** 늦어지지 않는 블록(이미 맞춰졌거나 목표형이 아님)으로 들어오면 */
export const GOAL_GUARD_ERROR_CODE = {
    NOT_LATE: 'GOAL_GUARD_NOT_LATE',
    VERSION_CONFLICT: 'BLOCK_VERSION_CONFLICT',
} as const;
