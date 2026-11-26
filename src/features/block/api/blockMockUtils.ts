import type { HomeBlock } from '@/features/block/types/block';
import type { TransferImpactItem } from '@/features/block/types/blockTransfer';
import { formatAmount, formatMonthDay, formatWon } from '@/lib/format';
import type { ImpactSeverity } from '@/shared/components/ui/ImpactList';
import type { Status } from '@/shared/components/ui/StatusTag';
import { ApiError } from '@/shared/types/api';

import { BLOCK_DETAIL_MOCK } from './blockDetailMock';
import { BLOCK_HOME_MOCK } from './blockHomeMock';

/**
 * 블록 목업 공용 계산 (블록 간 이동 blockTransferMock · 나눌 돈 배분 blockAllocationMock이 같이 쓴다)
 * 실제로는 서버가 계산한다. 목업 모드(USE_MOCK)에서만 쓴다.
 */

const STATUS_LABEL: Record<Status, string> = { SAFE: '안전', CAUTION: '주의', DANGER: '위험' };
export const SEVERITY_ORDER: Record<ImpactSeverity, number> = {
    danger: 0,
    warn: 1,
    good: 2,
    info: 3,
};
export const MAX_VISIBLE = 3;
/** 사용형 블록이 다시 안전으로 돌아가는 데 필요한 금액 (시안 03-2 값, 서버 상태 판정 전 임시) */
const SPENDING_SHORTFALL_MOCK = 50_000;
const WEEKS_PER_MONTH = 52 / 12;

const versions = new Map<number, number>();

export const versionOf = (blockId: number) => versions.get(blockId) ?? 1;

export function findBlock(blockId: number): HomeBlock {
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
export function shortfallOf(block: HomeBlock) {
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

export function fillRateOf(block: HomeBlock, balance: number) {
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
    if (detail?.type !== 'GOAL') {
        return undefined;
    }
    const { saved, target } = detail.monthly;
    if (target === null || target <= 0) {
        return undefined;
    }
    // 이번 달 모은 돈보다 많이 보내도 0 아래로는 내려가지 않는다. (나머지는 지난달까지 모은 돈에서 빠짐)
    const savedAfter = Math.max(0, saved + diff);
    const won = (amount: number) => formatAmount(amount, { showUnit: false });
    // 시안 03-2·명세 예시처럼 이 줄은 '원' 없이 숫자만 쓴다.
    return `이번 달 확보액 ${won(saved)} → ${won(savedAfter)} (월 목표 ${won(target)})`;
}

/** 블록 하나가 받거나(+) 보낼 때(−) 생기는 결과 한 줄 */
export function impactOf(block: HomeBlock, diff: number, shortfall: number): TransferImpactItem {
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
    const payDate =
        detail?.type === 'FIXED' && detail.nextPayDate
            ? formatMonthDay(detail.nextPayDate)
            : '납부일';
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

/** 확정 후 목업 값 반영 — 홈·상세가 다시 조회하면 바뀐 잔액이 보인다. */
export function applyBalance(block: HomeBlock, diff: number, recovers: boolean) {
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
        if (block.isDefault && BLOCK_HOME_MOCK.todayGuide) {
            BLOCK_HOME_MOCK.todayGuide = {
                ...BLOCK_HOME_MOCK.todayGuide,
                available,
                balance: block.balance,
            };
        }
    }
    if (detail?.type === 'GOAL') {
        const saved = Math.max(0, detail.monthly.saved + diff);
        detail.monthly = {
            ...detail.monthly,
            saved,
            remaining: Math.max(0, (detail.monthly.target ?? 0) - saved),
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
