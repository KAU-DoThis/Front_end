// 17 목표 달성 · 17-1 목표 기한 지남 시트. 끝난 목표형 블록을 어떻게 할지 고른다.
// TODO: 명세 v4 7장의 경로·요청 모양을 확인하지 못해 가정했다. 백엔드와 맞춘 뒤 고친다.

/** ACHIEVED 목표 금액을 다 모음 · OVERDUE 기한이 지났는데 다 못 모음 */
export type GoalOutcomeKind = 'ACHIEVED' | 'OVERDUE';

/**
 * 고를 수 있는 처리
 * 달성: KEEP 그대로 지키기(월 확보 금액 0) · RAISE_TARGET 목표 올리기 · MOVE 다른 블록으로 옮기기
 * 기한 지남: EXTEND 기한 늘리기 · FINISH_AT_CURRENT 모은 만큼으로 끝내기 · CLEANUP 블록 정리하기
 * 둘 다: REMIND_LATER 지금은 바꾸지 않음
 */
export type GoalOutcomeAction =
    'KEEP' | 'RAISE_TARGET' | 'MOVE' | 'EXTEND' | 'FINISH_AT_CURRENT' | 'CLEANUP' | 'REMIND_LATER';

/** 옮길 블록과 금액 */
export interface GoalMoveTo {
    blockId: number;
    amount: number;
}

/** POST /blocks/{blockId}/goal-outcome */
export interface ApplyGoalOutcomeRequest {
    action: GoalOutcomeAction;
    /** 낙관적 잠금 버전 (블록 상세와 같은 값) */
    version: number;
    /** RAISE_TARGET: 지금 목표보다 커야 한다. */
    newTargetAmount?: number;
    /** EXTEND (RAISE_TARGET에 같이 보내면 기한도 바꾼다) (yyyy-MM-dd) */
    newDueDate?: string;
    /** MOVE · CLEANUP: 옮길 곳. CLEANUP에서 남은 돈은 '남은 돈' 나눌 돈으로 돌아간다. */
    moveTo?: GoalMoveTo[];
}

export const GOAL_OUTCOME_ERROR_CODE = {
    /** 모은 돈이 없는데 FINISH_AT_CURRENT */
    NOTHING_SAVED: 'GOAL_NOTHING_SAVED',
    VERSION_CONFLICT: 'BLOCK_VERSION_CONFLICT',
} as const;
