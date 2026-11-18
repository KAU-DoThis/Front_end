import type { HomeBlock } from '@/features/block/types/block';
import type { BlockCreateRequest } from '@/features/block/types/blockCreate';
import type { BlockDeleteResponse, BlockPatch } from '@/features/block/types/blockUpdate';
import type { BlockColor } from '@/shared/components/ui/BlockBeaker';
import { ApiError } from '@/shared/types/api';

import { BLOCK_DETAIL_MOCK } from './blockDetailMock';
import { BLOCK_HOME_MOCK } from './blockHomeMock';

const EMPTY_RULE = { pay_day: null, pay_amount: null, monthly_target: null, match_condition: null };

function findMockBlock(blockId: number) {
    const block = BLOCK_HOME_MOCK.blocks.find((item) => item.blockId === blockId);
    if (!block) {
        throw new ApiError('BLOCK_NOT_FOUND', '블록을 찾을 수 없습니다.', 404);
    }
    return block;
}

/** 블록 수정 목업: 홈·상세 목업 값을 바꾼다. (상세 block은 홈 목업과 같은 객체) */
export function updateBlockMock(blockId: number, patch: BlockPatch) {
    const block = findMockBlock(blockId);
    if (patch.name !== undefined) block.name = patch.name;
    if (patch.color !== undefined) block.color = patch.color;
    if (patch.targetAmount !== undefined) block.targetAmount = patch.targetAmount;
    if (patch.dueDate !== undefined) block.dueDate = patch.dueDate;
    if (patch.payDay !== undefined)
        block.rule = { ...(block.rule ?? EMPTY_RULE), pay_day: patch.payDay };
    if (patch.payAmount !== undefined) {
        block.rule = { ...(block.rule ?? EMPTY_RULE), pay_amount: patch.payAmount };
    }

    const detail = BLOCK_DETAIL_MOCK[blockId];
    if (!detail) return;
    detail.version += 1;
    if (detail.type === 'SPENDING') {
        if (patch.monthlyAmount !== undefined) {
            detail.monthlyAmount = patch.monthlyAmount;
            detail.allocatedAmount = patch.monthlyAmount;
        }
        if (patch.startDay !== undefined) detail.startDay = patch.startDay;
    }
    if (detail.type === 'GOAL' && patch.targetAmount !== undefined) {
        detail.targetAmount = patch.targetAmount;
    }
    if (detail.type === 'FIXED') {
        if (patch.payAmount !== undefined) detail.payAmount = patch.payAmount;
        if (patch.alerts) detail.alerts = { ...detail.alerts, ...patch.alerts };
    }
}

/** 블록 삭제 목업: 기본 블록은 막고, 남은 잔액은 '남은 돈' 나눌 돈으로 돌린다. (서버 BlockService.deleteBlock과 같은 규칙) */
export function deleteBlockMock(blockId: number): BlockDeleteResponse {
    const block = findMockBlock(blockId);
    if (block.isDefault) {
        throw new ApiError('BLOCK_DEFAULT_UNDELETABLE', '기본 블록은 삭제할 수 없습니다.', 400);
    }
    BLOCK_HOME_MOCK.blocks = BLOCK_HOME_MOCK.blocks.filter((item) => item.blockId !== blockId);
    delete BLOCK_DETAIL_MOCK[blockId];
    if (block.balance === 0) {
        return { blockId, returnedAmount: 0, waitingFund: null };
    }
    const waitingFund = {
        waitingFundId:
            Math.max(0, ...BLOCK_HOME_MOCK.pendingMoney.map((fund) => fund.waitingFundId)) + 1,
        source: 'OTHER' as const,
        label: '남은 돈',
        description: `'${block.name}' 블록에서 돌아온 돈`,
        amount: block.balance,
        originalAmount: block.balance,
        createdAt: new Date().toISOString().slice(0, 19),
    };
    BLOCK_HOME_MOCK.pendingMoney.push(waitingFund);
    return { blockId, returnedAmount: block.balance, waitingFund };
}

const toDateString = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** 납부일까지 남은 날. 그달에 없는 납부일은 말일로 본다. (서버와 같은 규칙) */
function daysUntil(payDay: number, today: Date) {
    const dueIn = (year: number, month: number) =>
        new Date(year, month, Math.min(payDay, new Date(year, month + 1, 0).getDate()));
    let due = dueIn(today.getFullYear(), today.getMonth());
    if (due.getDate() < today.getDate()) due = dueIn(today.getFullYear(), today.getMonth() + 1);
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return Math.round((due.getTime() - start.getTime()) / 86_400_000);
}

/**
 * 블록 추가 목업: 잔액 0원 블록을 홈 목업 맨 뒤에 붙인다. (서버 BlockService.createBlock과 같은 기본값)
 * 상세 목업은 만들지 않아서 새 블록 상세는 준비 중으로 보인다.
 */
export function createBlockMock(body: BlockCreateRequest): HomeBlock {
    const today = new Date();
    const blocks = BLOCK_HOME_MOCK.blocks;
    const payDay = body.rule?.payDay ?? null;
    const block: HomeBlock = {
        blockId: Math.max(0, ...blocks.map((item) => item.blockId)) + 1,
        type: body.type,
        name: body.name,
        icon: null,
        balance: 0,
        isDefault: false,
        targetAmount: body.targetAmount ?? null,
        startDate: toDateString(today),
        dueDate:
            body.type === 'SPENDING'
                ? toDateString(new Date(today.getFullYear(), today.getMonth() + 1, 0))
                : (body.dueDate ?? null),
        rule:
            body.type === 'FIXED'
                ? { ...EMPTY_RULE, pay_day: payDay, pay_amount: body.rule?.payAmount ?? null }
                : null,
        status: 'SAFE',
        createdBy: 'USER',
        displayOrder: Math.max(-1, ...blocks.map((item) => item.displayOrder)) + 1,
        categories: [],
        color: (body.color?.toLowerCase() ?? 'i') as BlockColor,
        // 잔액 0원이라 빈 비커
        fillRate: 0,
        daysUntilPay: payDay === null ? null : daysUntil(payDay, today),
    };
    blocks.push(block);
    return block;
}
