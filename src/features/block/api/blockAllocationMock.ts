import type { HomeBlock } from '@/features/block/types/block';
import type { PendingMoney } from '@/features/block/types/blockHome';
import type {
    SimulateRequest,
    SimulateResponse,
    TransferImpactItem,
} from '@/features/block/types/blockTransfer';
import type {
    AllocationBreakdownItem,
    AllocationDraftResponse,
    AllocationRequest,
    AllocationResponse,
    AllocationTargetResponse,
} from '@/features/block/types/waitingFund';
import { WAITING_FUND_ERROR_CODE } from '@/features/block/types/waitingFund';
import { formatAmount, formatWon } from '@/lib/format';
import { ApiError } from '@/shared/types/api';

import { BLOCK_DETAIL_MOCK } from './blockDetailMock';
import { BLOCK_HOME_MOCK } from './blockHomeMock';
import {
    MAX_VISIBLE,
    SEVERITY_ORDER,
    applyBalance,
    fillRateOf,
    findBlock,
    impactOf,
    shortfallOf,
    versionOf,
} from './blockMockUtils';

/**
 * 나눌 돈 배분 목업 (시안 06 절약분 · 06-C 추가 입금)
 * 실제로는 서버가 계산한다. 목업은 홈·상세 목업 값으로 시안 문구가 나오도록 흉내만 낸다.
 * 확정하면 홈 목업의 블록 잔액과 나눌 돈을 바꿔서, 나눈 결과가 홈에 바로 보이게 한다.
 */

/** 절약분 요약 카드 아래 목표별 절약액 (홈 목업 waitingFundId 1, 시안 06 값) */
const BREAKDOWN_MOCK: Record<number, AllocationBreakdownItem[]> = {
    1: [
        { label: '배달', amount: 52_000 },
        { label: '카페', amount: 35_000 },
    ],
};

const NOTE_BY_SOURCE: Partial<Record<PendingMoney['source'], string>> = {
    SAVING: '아낀 돈은 생활비에서 꺼내서 나눠요',
    EXTRA_INCOME: '매달 들어오는 입금이 아니라서 절약분·월급과 따로 모아뒀어요',
};

const toUpperColor = (block: HomeBlock) =>
    block.color.toUpperCase() as AllocationTargetResponse['color'];

function findFund(waitingFundId: number) {
    const fund = BLOCK_HOME_MOCK.pendingMoney.find((item) => item.waitingFundId === waitingFundId);
    if (!fund) {
        throw new ApiError(
            WAITING_FUND_ERROR_CODE.NOT_FOUND,
            '나눌 돈을 찾을 수 없습니다. 이미 다 나눴을 수 있어요.',
            404,
        );
    }
    return fund;
}

/** 더 넣을 필요가 없는 블록 (목표형은 목표를 다 채움, 고정지출형은 이번 납부액을 다 채움) */
function canReceive(block: HomeBlock) {
    if (block.type === 'GOAL') {
        return block.targetAmount === null || block.balance < block.targetAmount;
    }
    if (block.type === 'FIXED') {
        return shortfallOf(block) > 0;
    }
    return true;
}

function captionOf(block: HomeBlock, source: PendingMoney['source']) {
    if (!canReceive(block)) {
        return block.type === 'FIXED' ? '이번 달 납부액을 채웠어요' : '목표를 다 채웠어요';
    }
    if (block.isDefault) {
        return source === 'SAVING' ? '남는 만큼 생활비로' : `사용형 ${block.fillRate}% 남음`;
    }
    switch (block.type) {
        case 'GOAL':
            if (block.status !== 'SAFE') {
                return `이번 달 ${formatWon(shortfallOf(block))} 부족`;
            }
            return block.targetAmount === null
                ? null
                : `목표 ${formatAmount(block.targetAmount, { showUnit: false })}  ${block.fillRate}%`;
        case 'FIXED':
            return `납부액 ${formatWon(shortfallOf(block))} 부족`;
        case 'SPENDING':
            return `사용형 ${block.fillRate}% 남음`;
    }
}

/** 절약분은 생활비에서 꺼낸 돈이라 '그냥 두기', 그 밖의 돈은 '넣기' */
function titleOf(block: HomeBlock, source: PendingMoney['source']) {
    if (!block.isDefault) {
        return block.name;
    }
    return source === 'SAVING' ? `${block.name}에 그냥 두기` : `${block.name}에 넣기`;
}

/** 넣을 수 있는 블록 → 기본 블록 → 다 채운 블록 순. 상태가 나쁜 블록이 먼저 온다. */
function orderTargets(blocks: HomeBlock[]) {
    const rank = (block: HomeBlock) => {
        if (!canReceive(block)) return 3;
        if (block.isDefault) return 2;
        return block.status === 'SAFE' ? 1 : 0;
    };
    return [...blocks].sort((a, b) => rank(a) - rank(b) || a.displayOrder - b.displayOrder);
}

/**
 * 처음 채워 둘 금액: 상태가 나쁜 블록에 모자란 만큼 먼저 넣고, 남는 돈은 첫 목표형 블록에 넣는다.
 * (시안 06: 여행에 먼저, 나머지는 저축)
 */
function suggestAmounts(blocks: HomeBlock[], total: number) {
    const amounts = new Map<number, number>();
    let left = total;
    const candidates = blocks.filter((block) => !block.isDefault && canReceive(block));

    for (const block of candidates) {
        if (left <= 0 || block.status === 'SAFE') continue;
        const amount = Math.min(shortfallOf(block), left);
        amounts.set(block.blockId, amount);
        left -= amount;
    }
    const goal = candidates.find((block) => block.type === 'GOAL' && block.status === 'SAFE');
    if (goal && left > 0) {
        amounts.set(goal.blockId, (amounts.get(goal.blockId) ?? 0) + left);
    }
    return amounts;
}

export function getAllocationDraftMock(waitingFundId: number): AllocationDraftResponse {
    const fund = findFund(waitingFundId);
    const blocks = orderTargets(BLOCK_HOME_MOCK.blocks);
    const suggested = suggestAmounts(blocks, fund.amount);

    return {
        waitingFund: fund,
        breakdown: BREAKDOWN_MOCK[waitingFundId] ?? [],
        note: NOTE_BY_SOURCE[fund.source] ?? null,
        targets: blocks.map((block) => ({
            blockId: block.blockId,
            title: titleOf(block, fund.source),
            caption: captionOf(block, fund.source),
            color: toUpperColor(block),
            status: block.status,
            fillRate: block.fillRate,
            isDefault: block.isDefault,
            canReceive: canReceive(block),
            suggestedAmount: suggested.get(block.blockId) ?? 0,
            version: versionOf(block.blockId),
        })),
    };
}

type AllocationChange = { fromWaitingFundId: number; toBlockId: number; amount: number };

const isAllocationChange = (change: SimulateRequest['changes'][number]) =>
    'fromWaitingFundId' in change;

/** 대기 자금 배분 미리보기 (POST /blocks/simulate의 fromWaitingFundId 요청) */
export function simulateAllocationMock({ changes }: SimulateRequest): SimulateResponse {
    const allocationChanges = changes.filter(isAllocationChange) as AllocationChange[];
    const [first] = allocationChanges;
    if (!first) {
        throw new ApiError('SIMULATE_NOT_SUPPORTED', '나눌 돈 배분만 미리 볼 수 있습니다.');
    }

    const fund = findFund(first.fromWaitingFundId);
    const entries = allocationChanges.map((change) => ({
        block: findBlock(change.toBlockId),
        amount: Math.max(0, Math.floor(change.amount)),
    }));
    const total = entries.reduce((sum, entry) => sum + entry.amount, 0);
    const blockedReason =
        total > fund.amount
            ? `${fund.label}(${formatWon(fund.amount)})보다 많이 나눌 수 없어요`
            : null;

    const items: TransferImpactItem[] = blockedReason
        ? []
        : entries
              .filter((entry) => entry.amount > 0)
              .map((entry) => impactOf(entry.block, entry.amount, shortfallOf(entry.block)))
              .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

    return {
        blocks: entries.map(({ block, amount }) => ({
            blockId: block.blockId,
            name: block.name,
            balanceBefore: block.balance,
            balanceAfter: block.balance + amount,
            fillRateAfter: fillRateOf(block, block.balance + amount),
            version: versionOf(block.blockId),
        })),
        items,
        hiddenCount: Math.max(0, items.length - MAX_VISIBLE),
        shortfall: null,
        remainingWaiting: fund.amount - total,
        requiresConfirm: false,
        blocked: blockedReason !== null,
        blockedReason,
    };
}

/** 배분 확정 — 블록 잔액을 늘리고 나눌 돈을 줄인다. 다 나누면 홈 목록에서 빠진다. */
export function allocateWaitingFundMock(
    waitingFundId: number,
    { allocations, leftoverTo = 'KEEP' }: AllocationRequest,
): AllocationResponse {
    const fund = findFund(waitingFundId);
    const total = allocations.reduce((sum, item) => sum + item.amount, 0);

    if (total <= 0 || total > fund.amount || allocations.some((item) => item.amount < 0)) {
        throw new ApiError(
            WAITING_FUND_ERROR_CODE.INSUFFICIENT,
            `${fund.label}(${formatWon(fund.amount)})보다 많이 나눌 수 없습니다.`,
            400,
        );
    }
    if (allocations.some((item) => item.version !== versionOf(item.blockId))) {
        throw new ApiError(
            WAITING_FUND_ERROR_CODE.VERSION_CONFLICT,
            '그사이 블록 잔액이 바뀌었습니다. 다시 확인해 주세요.',
            409,
        );
    }

    // 블록을 모두 찾은 뒤에 잔액을 바꾼다. 중간에 실패하면 앞 블록만 바뀌는 일이 없게 한다.
    const targets = allocations.map(({ blockId, amount }) => ({
        block: findBlock(blockId),
        amount,
    }));
    const received = targets.map(({ block, amount }) => {
        const shortfall = shortfallOf(block);
        applyBalance(
            block,
            amount,
            block.status !== 'SAFE' && shortfall > 0 && amount >= shortfall,
        );
        return block;
    });

    fund.amount -= total;
    const defaultBlock = BLOCK_HOME_MOCK.blocks.find((block) => block.isDefault);
    if (leftoverTo === 'DEFAULT_BLOCK' && defaultBlock && fund.amount > 0) {
        applyBalance(defaultBlock, fund.amount, false);
        received.push(defaultBlock);
        fund.amount = 0;
    }
    if (fund.amount === 0) {
        BLOCK_HOME_MOCK.pendingMoney = BLOCK_HOME_MOCK.pendingMoney.filter(
            (item) => item.waitingFundId !== waitingFundId,
        );
    }

    const receivedDefault = received.find((block) => block.isDefault);
    const guide = BLOCK_HOME_MOCK.todayGuide;
    // 오늘 남은 돈은 applyBalance가 오늘 쓴 돈을 빼서 상세에 저장한 값을 그대로 쓴다.
    const defaultDetail = receivedDefault ? BLOCK_DETAIL_MOCK[receivedDefault.blockId] : undefined;
    const todayRemaining =
        defaultDetail?.type === 'SPENDING' ? defaultDetail.today.remaining : guide?.available;

    return {
        waitingFund: { waitingFundId, amount: fund.amount },
        blocks: received.map((block) => ({
            blockId: block.blockId,
            balance: block.balance,
            status: block.status,
            version: versionOf(block.blockId),
        })),
        dailyGuide:
            receivedDefault && guide
                ? {
                      todayAvailable: guide.available,
                      todayRemaining: todayRemaining ?? guide.available,
                  }
                : null,
    };
}
