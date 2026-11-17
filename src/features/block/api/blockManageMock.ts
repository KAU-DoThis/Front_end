import type { BlockPatch } from '@/features/block/types/blockUpdate';
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
