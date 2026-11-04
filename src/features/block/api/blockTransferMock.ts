import type { HomeBlock } from '@/features/block/types/block';
import type {
    SimulateRequest,
    SimulateResponse,
    TransferImpactItem,
    TransferRequest,
    TransferResponse,
} from '@/features/block/types/blockTransfer';
import { TRANSFER_ERROR_CODE } from '@/features/block/types/blockTransfer';
import { formatAmount, formatMonthDay, formatWon } from '@/lib/format';
import type { ImpactSeverity } from '@/shared/components/ui/ImpactList';
import type { Status } from '@/shared/components/ui/StatusTag';
import { ApiError } from '@/shared/types/api';

import { BLOCK_DETAIL_MOCK } from './blockDetailMock';
import { BLOCK_HOME_MOCK } from './blockHomeMock';

/**
 * 블록 간 이동 목업 (API 명세 v4 6장 응답 모양)
 * 실제로는 서버가 계산한다. 목업은 시안 03-2 문구가 나오도록 단순한 규칙으로 흉내만 낸다.
 * 확정하면 홈·상세 목업 값을 바꿔서, 옮긴 결과가 화면에 바로 보이게 한다.
 * TODO: 백엔드 /blocks/simulate · /blocks/transfers가 나오면 blockApi.ts에서 request로 바꾸고 이 파일을 지운다.
 */

const STATUS_LABEL: Record<Status, string> = { SAFE: '안전', CAUTION: '주의', DANGER: '위험' };
const SEVERITY_ORDER: Record<ImpactSeverity, number> = { danger: 0, warn: 1, good: 2, info: 3 };
const MAX_VISIBLE = 3;
/** 사용형 블록이 다시 안전으로 돌아가는 데 필요한 금액 (시안 03-2 값, 서버 상태 판정 전 임시) */
const SPENDING_SHORTFALL_MOCK = 50_000;
const WEEKS_PER_MONTH = 52 / 12;

const versions = new Map<number, number>();
let nextTransferId = 1;
let nextScheduledTransferId = 1;

const versionOf = (blockId: number) => versions.get(blockId) ?? 1;

function findBlock(blockId: number): HomeBlock {
    const block = BLOCK_HOME_MOCK.blocks.find((item) => item.blockId === blockId);
    if (!block) {
        throw new ApiError('BLOCK_NOT_FOUND', '블록을 찾을 수 없습니다.', 404);
    }
    return block;
}

/** 하루 쓸 돈 = 잔액 ÷ 남은 일수, 100원 내림 (백엔드 DailyGuideCalculator와 같은 식) */
function dailyBudget(balance: number, remainingDays: number) {
    if (balance <= 0 || remainingDays <= 0) {
        return 0;
    }
    return Math.floor(balance / remainingDays / 100) * 100;
}

function spendingDays(blockId: number) {
    const detail = BLOCK_DETAIL_MOCK[blockId];
    return detail?.type === 'SPENDING' ? detail.remainingDays : 1;
}

/** 받는 블록이 상태를 되찾는 데 모자란 금액 ([부족한 만큼] 버튼 값) */
function shortfallOf(block: HomeBlock) {
    const detail = BLOCK_DETAIL_MOCK[block.blockId];
    switch (block.type) {
        case 'SPENDING':
            return block.status === 'SAFE' ? 0 : SPENDING_SHORTFALL_MOCK;
        case 'GOAL':
            return detail?.type === 'GOAL' ? detail.monthly.remaining : 0;
        case 'FIXED':
            return detail?.type === 'FIXED' ? Math.max(0, detail.payAmount - block.balance) : 0;
    }
}

function fillRateOf(block: HomeBlock, balance: number) {
    const detail = BLOCK_DETAIL_MOCK[block.blockId];
    const capacity =
        detail?.type === 'SPENDING'
            ? detail.allocatedAmount
            : detail?.type === 'FIXED'
              ? detail.payAmount
              : (block.targetAmount ?? 0);
    if (capacity <= 0) {
        return block.fillRate;
    }
    return Math.min(100, Math.max(0, Math.round((balance / capacity) * 100)));
}

/** 목표형 월 목표 대비 몇 주 당겨지거나 밀리는지 */
function goalWeeks(block: HomeBlock, amount: number) {
    const monthlyTarget = block.rule?.monthly_target ?? 0;
    if (monthlyTarget <= 0) {
        return 0;
    }
    // 늦어지는 쪽을 작게 보이지 않도록 올림한다.
    return Math.ceil((amount / monthlyTarget) * WEEKS_PER_MONTH);
}

function goalMonthlyDetail(block: HomeBlock, diff: number) {
    const detail = BLOCK_DETAIL_MOCK[block.blockId];
    if (detail?.type !== 'GOAL' || detail.monthly.target <= 0) {
        return undefined;
    }
    const { saved, target } = detail.monthly;
    // 이번 달 모은 돈보다 많이 보내도 0 아래로는 내려가지 않는다. (나머지는 지난달까지 모은 돈에서 빠짐)
    const savedAfter = Math.max(0, saved + diff);
    const won = (amount: number) => formatAmount(amount, { showUnit: false });
    // 시안 03-2·명세 예시처럼 이 줄은 '원' 없이 숫자만 쓴다.
    return `이번 달 확보액 ${won(saved)} → ${won(savedAfter)} (월 목표 ${won(target)})`;
}

/** 블록 하나가 받거나(+) 보낼 때(−) 생기는 결과 한 줄 */
function impactOf(block: HomeBlock, diff: number, shortfall: number): TransferImpactItem {
    const { blockId, name } = block;
    const isReceiving = diff > 0;
    const recovers = isReceiving && block.status !== 'SAFE' && diff >= shortfall && shortfall > 0;

    if (block.type === 'SPENDING') {
        const days = spendingDays(blockId);
        const before = dailyBudget(block.balance, days);
        const after = dailyBudget(block.balance + diff, days);
        const budgetText = `하루 쓸 돈 ${formatWon(before)} → ${formatWon(after)}`;
        if (recovers) {
            return {
                type: 'status_change',
                severity: 'good',
                blockId,
                title: `${name} ${STATUS_LABEL[block.status]} → ${STATUS_LABEL.SAFE}`,
                detail: budgetText,
                before: block.status,
                after: 'SAFE',
            };
        }
        return {
            type: 'daily_budget',
            severity: isReceiving ? 'good' : 'warn',
            blockId,
            title: budgetText,
        };
    }

    if (block.type === 'GOAL') {
        const weeks = goalWeeks(block, Math.abs(diff));
        const detail = goalMonthlyDetail(block, diff);
        if (recovers) {
            return {
                type: 'status_change',
                severity: 'good',
                blockId,
                title: `${name} ${STATUS_LABEL[block.status]} → ${STATUS_LABEL.SAFE}`,
                detail,
                before: block.status,
                after: 'SAFE',
            };
        }
        if (weeks >= 1) {
            return {
                type: 'goal_date',
                severity: isReceiving ? 'good' : 'warn',
                blockId,
                title: `${name} 목표가 약 ${weeks}주 ${isReceiving ? '빨라져요' : '늦어져요'}`,
                detail,
            };
        }
        return {
            type: 'monthly_secured',
            severity: isReceiving ? 'good' : 'info',
            blockId,
            title: `${name} 모은 돈 ${formatWon(block.balance)} → ${formatWon(block.balance + diff)}`,
            detail,
        };
    }

    const detail = BLOCK_DETAIL_MOCK[blockId];
    const payAmount = detail?.type === 'FIXED' ? detail.payAmount : block.balance;
    const payDate = detail?.type === 'FIXED' ? formatMonthDay(detail.nextPayDate) : '납부일';
    const after = block.balance + diff;
    if (after < payAmount) {
        return {
            type: 'payment',
            severity: isReceiving ? 'warn' : 'danger',
            blockId,
            title: `${name} ${payDate}에 ${formatWon(payAmount - after)} 모자라요`,
            detail: `${payDate} ${formatWon(payAmount)} 중 ${formatWon(Math.max(0, after))}만 확보`,
        };
    }
    return {
        type: 'payment',
        severity: 'good',
        blockId,
        title: `${name} 납부 영향 없음`,
        detail: `${payDate} ${formatWon(payAmount)} 확보 유지`,
    };
}

/** 이동과 상관없는 고정지출형 블록도 "납부 영향 없음"을 보여준다. (시안 03-2 셋째 줄) */
function untouchedFixedImpacts(excludeIds: number[]): TransferImpactItem[] {
    return BLOCK_HOME_MOCK.blocks
        .filter((block) => block.type === 'FIXED' && !excludeIds.includes(block.blockId))
        .filter((block) => shortfallOf(block) === 0)
        .map((block) => impactOf(block, 0, 0));
}

export function simulateTransferMock({ changes }: SimulateRequest): SimulateResponse {
    const [change] = changes;
    if (!change || !('fromBlockId' in change)) {
        // 대기 자금 배분(06)은 ⑤ 작업에서 붙인다.
        throw new ApiError('SIMULATE_NOT_SUPPORTED', '대기 자금 배분 미리보기는 아직 없습니다.');
    }

    const from = findBlock(change.fromBlockId);
    const to = findBlock(change.toBlockId);
    const amount = Math.max(0, Math.floor(change.amount));
    const shortfall = shortfallOf(to);

    const blockedReason =
        from.blockId === to.blockId
            ? '같은 블록으로는 옮길 수 없어요'
            : amount > from.balance
              ? `${from.name} 잔액(${formatWon(from.balance)})보다 많이 옮길 수 없어요`
              : null;

    const items =
        blockedReason || amount === 0
            ? []
            : [
                  impactOf(from, -amount, 0),
                  impactOf(to, amount, shortfall),
                  ...untouchedFixedImpacts([from.blockId, to.blockId]),
              ].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

    return {
        blocks: [
            {
                blockId: from.blockId,
                name: from.name,
                balanceBefore: from.balance,
                balanceAfter: from.balance - amount,
                fillRateAfter: fillRateOf(from, from.balance - amount),
                version: versionOf(from.blockId),
            },
            {
                blockId: to.blockId,
                name: to.name,
                balanceBefore: to.balance,
                balanceAfter: to.balance + amount,
                fillRateAfter: fillRateOf(to, to.balance + amount),
                version: versionOf(to.blockId),
            },
        ],
        items,
        hiddenCount: Math.max(0, items.length - MAX_VISIBLE),
        shortfall: { blockId: to.blockId, amount: shortfall },
        remainingWaiting: null,
        requiresConfirm: items.some((item) => item.severity === 'danger'),
        blocked: blockedReason !== null,
        blockedReason,
    };
}

/** 확정 후 목업 값 반영 — 홈·상세가 다시 조회하면 바뀐 잔액이 보인다. */
function applyBalance(block: HomeBlock, diff: number, recovers: boolean) {
    block.balance += diff;
    block.fillRate = fillRateOf(block, block.balance);
    if (recovers) {
        block.status = 'SAFE';
    }

    const detail = BLOCK_DETAIL_MOCK[block.blockId];
    if (detail && recovers) {
        // 안전으로 돌아오면 '왜 주의인가요?' 이유도 사라진다.
        detail.statusReason = null;
        detail.explanation = null;
    }
    if (detail?.type === 'SPENDING') {
        const available = dailyBudget(block.balance, detail.remainingDays);
        detail.today = {
            ...detail.today,
            available,
            remaining: available - detail.today.spent,
        };
        if (block.isDefault) {
            BLOCK_HOME_MOCK.todayAvailable = available;
            BLOCK_HOME_MOCK.todayBasis = { ...BLOCK_HOME_MOCK.todayBasis, balance: block.balance };
        }
    }
    if (detail?.type === 'GOAL') {
        const saved = Math.max(0, detail.monthly.saved + diff);
        detail.monthly = {
            ...detail.monthly,
            saved,
            remaining: Math.max(0, detail.monthly.target - saved),
        };
    }
    if (detail?.type === 'FIXED') {
        detail.shortfall = Math.max(0, detail.payAmount - block.balance);
        if (detail.shortfall > 0) {
            block.status = 'DANGER';
        }
    }
    versions.set(block.blockId, versionOf(block.blockId) + 1);
}

export function transferBlockMock(request: TransferRequest): TransferResponse {
    const simulation = simulateTransferMock({
        changes: [
            {
                fromBlockId: request.fromBlockId,
                toBlockId: request.toBlockId,
                amount: request.amount,
            },
        ],
    });

    if (request.fromBlockId === request.toBlockId) {
        throw new ApiError(
            TRANSFER_ERROR_CODE.SAME_BLOCK,
            '같은 블록으로는 옮길 수 없습니다.',
            400,
        );
    }
    if (simulation.blocked || request.amount <= 0) {
        throw new ApiError(
            TRANSFER_ERROR_CODE.INSUFFICIENT_BALANCE,
            simulation.blockedReason ?? '옮길 금액을 확인해 주세요.',
            400,
        );
    }
    if (simulation.requiresConfirm && !request.confirmed) {
        throw new ApiError(
            TRANSFER_ERROR_CODE.CONFIRM_REQUIRED,
            '규칙이 깨지는 이동이라 한 번 더 확인이 필요합니다.',
            400,
        );
    }
    if (
        request.fromVersion !== versionOf(request.fromBlockId) ||
        request.toVersion !== versionOf(request.toBlockId)
    ) {
        throw new ApiError(
            TRANSFER_ERROR_CODE.VERSION_CONFLICT,
            '그사이 블록 잔액이 바뀌었습니다. 다시 확인해 주세요.',
            409,
        );
    }

    const from = findBlock(request.fromBlockId);
    const to = findBlock(request.toBlockId);
    const shortfall = shortfallOf(to);
    const recovers = to.status !== 'SAFE' && shortfall > 0 && request.amount >= shortfall;

    applyBalance(from, -request.amount, false);
    applyBalance(to, request.amount, recovers);

    const defaultBlock = [from, to].find((block) => block.isDefault);
    const income = BLOCK_HOME_MOCK.nextExpectedIncome;

    return {
        transferId: nextTransferId++,
        fromBlock: {
            blockId: from.blockId,
            balance: from.balance,
            status: from.status,
            version: versionOf(from.blockId),
        },
        toBlock: {
            blockId: to.blockId,
            balance: to.balance,
            status: to.status,
            version: versionOf(to.blockId),
        },
        dailyGuide: defaultBlock
            ? {
                  todayAvailable: BLOCK_HOME_MOCK.todayAvailable,
                  todayRemaining:
                      BLOCK_HOME_MOCK.todayAvailable -
                      (BLOCK_DETAIL_MOCK[defaultBlock.blockId]?.type === 'SPENDING'
                          ? spendingSpentToday(defaultBlock.blockId)
                          : 0),
              }
            : null,
        scheduledReturn:
            request.autoReturn.enabled && income
                ? {
                      scheduledTransferId: nextScheduledTransferId++,
                      expectedDate: income.expectedDate,
                      amount: request.amount,
                  }
                : null,
    };
}

function spendingSpentToday(blockId: number) {
    const detail = BLOCK_DETAIL_MOCK[blockId];
    return detail?.type === 'SPENDING' ? detail.today.spent : 0;
}
