import type {
    SimulateRequest,
    SimulateResponse,
    TransferImpactItem,
    TransferRequest,
    TransferResponse,
} from '@/features/block/types/blockTransfer';
import { TRANSFER_ERROR_CODE } from '@/features/block/types/blockTransfer';
import { formatWon } from '@/lib/format';
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
 * 블록 간 이동 목업 (API 명세 v4 6장 응답 모양)
 * 실제로는 서버가 계산한다. 목업은 시안 03-2 문구가 나오도록 단순한 규칙으로 흉내만 낸다.
 * 확정하면 홈·상세 목업 값을 바꿔서, 옮긴 결과가 화면에 바로 보이게 한다.
 * 서버 모드는 /blocks/simulate · /blocks/transfers를 쓰고, 이 파일은 목업 모드(USE_MOCK)에서만 쓴다.
 */

let nextTransferId = 1;
let nextScheduledTransferId = 1;

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
        // 대기 자금 배분(06)은 blockAllocationMock의 simulateAllocationMock이 맡는다.
        throw new ApiError('SIMULATE_NOT_SUPPORTED', '블록 간 이동만 미리 볼 수 있습니다.');
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
        dailyGuide:
            defaultBlock && BLOCK_HOME_MOCK.todayGuide
                ? {
                      todayAvailable: BLOCK_HOME_MOCK.todayGuide.available,
                      todayRemaining:
                          BLOCK_HOME_MOCK.todayGuide.available -
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
