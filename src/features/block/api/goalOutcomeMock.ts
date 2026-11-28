import type { GoalBlockDetail } from '@/features/block/types/blockDetail';
import type {
    ApplyGoalOutcomeRequest,
    GoalOutcomeAction,
    GoalOutcomeKind,
} from '@/features/block/types/goalOutcome';
import { GOAL_OUTCOME_ERROR_CODE } from '@/features/block/types/goalOutcome';
import { goalOutcomeOf, todayKst } from '@/features/block/utils/goalOutcome';
import { formatMonthDay } from '@/lib/format';
import { ApiError } from '@/shared/types/api';

import { BLOCK_DETAIL_MOCK } from './blockDetailMock';
import { deleteBlockMock, updateBlockMock } from './blockManageMock';
import { applyBalance, findBlock } from './blockMockUtils';

/**
 * 목표 달성(17) · 기한 지남(17-1) 처리 목업. 실제로는 서버가 처리한다.
 * 홈·상세 목업 값을 바꿔서, 처리한 뒤 상세를 다시 받으면 바뀐 목표가 보이게 한다.
 */

const ACTIONS: Record<GoalOutcomeKind, GoalOutcomeAction[]> = {
    ACHIEVED: ['KEEP', 'RAISE_TARGET', 'MOVE', 'REMIND_LATER'],
    OVERDUE: ['EXTEND', 'FINISH_AT_CURRENT', 'CLEANUP', 'REMIND_LATER'],
};

const badRequest = (code: string, message: string) => new ApiError(code, message, 400);

const parse = (date: string) => date.slice(0, 10).split('-').map(Number);

/** 이번 달부터 기한 달까지 달력 월 수 (이번 달 포함) */
function monthsUntil(dueDate: string, today: string) {
    const [year, month] = parse(today);
    const [dueYear, dueMonth] = parse(dueDate);
    return Math.max(1, (dueYear - year) * 12 + (dueMonth - month) + 1);
}

/** 월 확보 금액을 바꾼다. */
function setMonthlyTarget(detail: GoalBlockDetail, monthlyTarget: number) {
    const block = findBlock(detail.block.blockId);
    block.rule = {
        pay_day: null,
        pay_amount: null,
        match_condition: null,
        ...block.rule,
        monthly_target: monthlyTarget,
    };
    detail.monthly = {
        target: monthlyTarget,
        saved: detail.monthly.saved,
        remaining: Math.max(0, monthlyTarget - detail.monthly.saved),
    };
}

/** 새 기한에 맞춰 남은 금액 ÷ 남은 개월로 월 확보 금액을 다시 잡고, 늦어짐 표시를 지운다. */
function replan(detail: GoalBlockDetail, dueDate: string, today: string) {
    const remaining = Math.max(0, detail.targetAmount - detail.block.balance);
    setMonthlyTarget(detail, Math.ceil(remaining / monthsUntil(dueDate, today)));
    findBlock(detail.block.blockId).status = 'SAFE';
    detail.statusReason = null;
    detail.explanation = null;
    if (detail.projection) {
        detail.projection = {
            ...detail.projection,
            isLate: false,
            paceText: '목표일에 맞춰 모여요',
            expectedDate: dueDate,
            expectedLabel: formatMonthDay(dueDate),
        };
    }
}

/** 다른 블록으로 옮긴다. (나머지는 그대로 둔다) */
function moveTo(detail: GoalBlockDetail, request: ApplyGoalOutcomeRequest) {
    const moves = request.moveTo ?? [];
    const total = moves.reduce((sum, move) => sum + move.amount, 0);
    const from = findBlock(detail.block.blockId);
    if (moves.some((move) => move.amount <= 0 || move.blockId === from.blockId)) {
        throw badRequest('GOAL_MOVE_INVALID', '옮길 블록과 금액을 확인해 주세요.');
    }
    if (total > from.balance) {
        throw badRequest('INSUFFICIENT_BALANCE', '모은 돈보다 많이 옮길 수 없습니다.');
    }
    moves.forEach((move) => applyBalance(findBlock(move.blockId), move.amount, false));
    applyBalance(from, -total, false);
}

export function applyGoalOutcomeMock(blockId: number, request: ApplyGoalOutcomeRequest) {
    const detail = BLOCK_DETAIL_MOCK[blockId];
    const today = todayKst();
    const kind = goalOutcomeOf(detail, today);
    if (detail?.type !== 'GOAL' || !kind) {
        throw badRequest('GOAL_OUTCOME_NOT_APPLICABLE', '끝난 목표가 아닙니다.');
    }
    if (detail.version !== request.version) {
        throw new ApiError(
            GOAL_OUTCOME_ERROR_CODE.VERSION_CONFLICT,
            '다른 곳에서 블록이 수정되었습니다. 새로 불러와 다시 시도해 주세요.',
            409,
        );
    }
    if (!ACTIONS[kind].includes(request.action)) {
        throw badRequest('GOAL_OUTCOME_ACTION_INVALID', '지금 고를 수 없는 처리입니다.');
    }

    const { balance } = detail.block;
    switch (request.action) {
        case 'KEEP':
            setMonthlyTarget(detail, 0);
            detail.version += 1;
            break;
        case 'RAISE_TARGET': {
            const { newTargetAmount, newDueDate } = request;
            if (newTargetAmount === undefined || newTargetAmount <= detail.targetAmount) {
                throw badRequest('GOAL_TARGET_NOT_RAISED', '지금 목표보다 크게 정해 주세요.');
            }
            updateBlockMock(blockId, { targetAmount: newTargetAmount, dueDate: newDueDate });
            const dueDate = newDueDate ?? detail.block.dueDate;
            if (dueDate) replan(detail, dueDate, today);
            detail.statusReason = null;
            break;
        }
        case 'MOVE':
            moveTo(detail, request);
            detail.version += 1;
            break;
        case 'EXTEND': {
            const { newDueDate } = request;
            if (!newDueDate || newDueDate < today) {
                throw badRequest('GOAL_DUE_DATE_INVALID', '오늘 이후로 정해 주세요.');
            }
            updateBlockMock(blockId, { dueDate: newDueDate });
            replan(detail, newDueDate, today);
            break;
        }
        case 'FINISH_AT_CURRENT':
            if (balance <= 0) {
                throw badRequest(GOAL_OUTCOME_ERROR_CODE.NOTHING_SAVED, '모은 돈이 없습니다.');
            }
            updateBlockMock(blockId, { targetAmount: balance });
            setMonthlyTarget(detail, 0);
            findBlock(blockId).status = 'SAFE';
            detail.statusReason = '목표 달성';
            detail.explanation = null;
            if (detail.projection) detail.projection = { ...detail.projection, isLate: false };
            break;
        case 'CLEANUP':
            if (request.moveTo?.length) moveTo(detail, request);
            // 남은 돈은 블록 삭제와 같이 '남은 돈' 나눌 돈으로 돌아간다.
            return deleteBlockMock(blockId);
        case 'REMIND_LATER':
            break;
    }
    return null;
}
