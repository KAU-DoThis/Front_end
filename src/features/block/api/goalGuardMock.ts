import type { GoalBlockDetail } from '@/features/block/types/blockDetail';
import type {
    ApplyGoalGuardRequest,
    GoalGuard,
    GoalGuardOption,
} from '@/features/block/types/goalGuard';
import { GOAL_GUARD_ERROR_CODE } from '@/features/block/types/goalGuard';
import { goalOutcomeOf, todayKst } from '@/features/block/utils/goalOutcome';
import { formatAmount, formatMonthDay } from '@/lib/format';
import { ApiError } from '@/shared/types/api';

import { allocateWaitingFundMock } from './blockAllocationMock';
import { BLOCK_DETAIL_MOCK } from './blockDetailMock';
import { BLOCK_HOME_MOCK } from './blockHomeMock';
import { updateBlockMock } from './blockManageMock';
import { findBlock, versionOf } from './blockMockUtils';

/**
 * 목표 지키기 목업 (시안 16)
 * 여행 블록(3)은 시안 숫자 그대로, 다른 목표형 블록이 늦어지면 목표일 미루기 · 목표 줄이기만 만든다.
 * 실제로는 서버가 계산한다. 반영하면 홈·상세 목업 값을 바꿔서 상세가 안전으로 돌아오게 한다.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

const won = (amount: number) => formatAmount(amount, { showUnit: false });

const toTime = (date: string) => {
    const [year, month, day] = date.slice(0, 10).split('-').map(Number);
    return Date.UTC(year, month - 1, day);
};

/** 옵션 하나 + 고르면 목업에서 할 일 */
interface MockOption {
    option: GoalGuardOption;
    apply: () => void;
}

/** 시안 16 여행 블록 옵션 (절약분 waitingFundId 1에서 50,000원) */
function travelOptions(detail: GoalBlockDetail): MockOption[] {
    const { blockId } = detail.block;
    const savingFund = BLOCK_HOME_MOCK.pendingMoney.find((fund) => fund.source === 'SAVING');
    const options: MockOption[] = [];

    if (savingFund && savingFund.amount >= 50_000) {
        options.push({
            option: {
                optionId: 'put-waiting-fund',
                type: 'PUT_WAITING_FUND',
                title: '9월 절약분 50,000원 넣기',
                description: '배분 안 한 절약액에서 옮겨요',
                resultDate: '2026-12-31',
                resultLabel: '목표일 맞춤',
                isRecommended: true,
            },
            apply: () =>
                allocateWaitingFundMock(savingFund.waitingFundId, {
                    allocations: [{ blockId, amount: 50_000, version: versionOf(blockId) }],
                    leftoverTo: 'KEEP',
                }),
        });
    }
    options.push(
        {
            option: {
                optionId: 'raise-monthly',
                type: 'RAISE_MONTHLY',
                title: '생활비에서 매달 30,000원 더',
                description: '생활비 하루 쓸 돈이 1,000원 줄어요',
                resultDate: '2026-12-24',
                resultLabel: '1주 빨라짐',
                isRecommended: false,
            },
            apply: () => raiseMonthlyTarget(detail, 30_000),
        },
        {
            option: {
                optionId: 'postpone-due-date',
                type: 'POSTPONE_DUE_DATE',
                title: '목표일을 1월 15일로 미루기',
                description: '넣는 금액은 지금 그대로',
                resultDate: '2027-01-15',
                resultLabel: '새 목표일',
                isRecommended: false,
            },
            apply: () => updateBlockMock(blockId, { dueDate: '2027-01-15' }),
        },
        {
            option: {
                optionId: 'reduce-target',
                type: 'REDUCE_TARGET',
                title: '목표를 700,000원으로 줄이기',
                description: `${detail.block.name} 예산을 다시 잡아요`,
                resultDate: '2026-12-20',
                resultLabel: '목표일 전',
                isRecommended: false,
            },
            apply: () => updateBlockMock(blockId, { targetAmount: 700_000 }),
        },
    );
    // 절약분이 없으면 첫 번째 방법을 추천으로 둔다.
    if (!options.some(({ option }) => option.isRecommended)) {
        options[0].option.isRecommended = true;
    }
    return options;
}

/** 시안에 없는 목표형 블록: 예상일로 미루기 · 목표일까지 모을 수 있는 만큼으로 줄이기 */
function genericOptions(
    detail: GoalBlockDetail,
    dueDate: string,
    expectedDate: string,
): MockOption[] {
    const { block, targetAmount } = detail;
    const today = Date.now();
    const dueSpan = Math.max(1, toTime(dueDate) - today);
    const expectedSpan = Math.max(dueSpan, toTime(expectedDate) - today);
    const reachable =
        Math.floor(
            (block.balance + (targetAmount - block.balance) * (dueSpan / expectedSpan)) / 10_000,
        ) * 10_000;

    const options: MockOption[] = [
        {
            option: {
                optionId: 'postpone-due-date',
                type: 'POSTPONE_DUE_DATE',
                title: `목표일을 ${formatMonthDay(expectedDate)}로 미루기`,
                description: '넣는 금액은 지금 그대로',
                resultDate: expectedDate,
                resultLabel: '새 목표일',
                isRecommended: true,
            },
            apply: () => updateBlockMock(block.blockId, { dueDate: expectedDate }),
        },
    ];
    if (reachable > block.balance && reachable < targetAmount) {
        options.push({
            option: {
                optionId: 'reduce-target',
                type: 'REDUCE_TARGET',
                title: `목표를 ${won(reachable)}원으로 줄이기`,
                description: `${block.name} 예산을 다시 잡아요`,
                resultDate: dueDate,
                resultLabel: '목표일 맞춤',
                isRecommended: false,
            },
            apply: () => updateBlockMock(block.blockId, { targetAmount: reachable }),
        });
    }
    return options;
}

/** 월 확보 금액을 올린다. (목업은 목표형 쪽만 바꾸고, 생활비 쪽은 서버가 계산한다) */
function raiseMonthlyTarget(detail: GoalBlockDetail, amount: number) {
    const block = findBlock(detail.block.blockId);
    const monthlyTarget = (block.rule?.monthly_target ?? 0) + amount;
    if (block.rule) {
        block.rule = { ...block.rule, monthly_target: monthlyTarget };
    }
    detail.monthly = {
        target: monthlyTarget,
        saved: detail.monthly.saved,
        remaining: Math.max(0, monthlyTarget - detail.monthly.saved),
    };
    detail.version += 1;
}

/** 늦어지는 목표형 블록이면 상세와 옵션을 준다. 아니면 서버처럼 400으로 막는다. */
function findLateGoal(blockId: number) {
    const detail = BLOCK_DETAIL_MOCK[blockId];
    const dueDate = detail?.block.dueDate;
    if (
        detail?.type !== 'GOAL' ||
        !detail.projection?.isLate ||
        !dueDate ||
        // 기한이 지났거나 다 모은 목표는 목표 지키기 대상이 아니다. (17 · 17-1이 맡는다)
        goalOutcomeOf(detail, todayKst()) !== null
    ) {
        throw new ApiError(GOAL_GUARD_ERROR_CODE.NOT_LATE, '늦어지는 목표가 아닙니다.', 400);
    }
    const { expectedDate, expectedLabel } = detail.projection;
    const options =
        blockId === 3 ? travelOptions(detail) : genericOptions(detail, dueDate, expectedDate);
    return { detail, dueDate, expectedDate, expectedLabel, options };
}

/** 늦어지는 주 수 (헤드라인용, 올림) */
function lateWeeks(dueDate: string, expectedDate: string) {
    return Math.max(1, Math.ceil((toTime(expectedDate) - toTime(dueDate)) / (7 * DAY_MS)));
}

export function getGoalGuardMock(blockId: number): GoalGuard {
    const { detail, dueDate, expectedDate, expectedLabel, options } = findLateGoal(blockId);
    const { monthly } = detail;

    return {
        block: detail.block,
        targetAmount: detail.targetAmount,
        dueDate,
        expectedDate,
        expectedLabel,
        headline: `지금 속도면 목표일보다 ${lateWeeks(dueDate, expectedDate)}주쯤 늦어요`,
        message:
            monthly.target !== null && monthly.target > monthly.saved
                ? `이번 달 확보 금액이 ${won(monthly.target - monthly.saved)}원 모자라요. 아래 방법 중 하나를 고르면 바로 반영할게요`
                : '아래 방법 중 하나를 고르면 바로 반영할게요',
        options: options.map(({ option }) => option),
        version: detail.version,
    };
}

/** 고른 방법을 반영하고, 블록을 목표일에 맞춰지는 안전 상태로 바꾼다. */
export function applyGoalGuardMock(blockId: number, { optionId, version }: ApplyGoalGuardRequest) {
    const { detail, options } = findLateGoal(blockId);
    if (detail.version !== version) {
        throw new ApiError(
            GOAL_GUARD_ERROR_CODE.VERSION_CONFLICT,
            '다른 곳에서 블록이 수정되었습니다. 새로 불러와 다시 시도해 주세요.',
            409,
        );
    }
    const picked = options.find(({ option }) => option.optionId === optionId);
    if (!picked) {
        throw new ApiError('GOAL_GUARD_OPTION_NOT_FOUND', '고를 수 없는 방법입니다.', 400);
    }
    picked.apply();

    const resultDate = picked.option.resultDate;
    findBlock(blockId).status = 'SAFE';
    detail.statusReason = null;
    detail.explanation = null;
    if (detail.projection) {
        detail.projection = {
            ...detail.projection,
            isLate: false,
            paceText: '목표일에 맞춰 모여요',
            expectedDate: resultDate,
            expectedLabel: formatMonthDay(resultDate),
        };
    }
    return null;
}
