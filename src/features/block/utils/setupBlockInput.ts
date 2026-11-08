import type { BlockRule } from '@/features/block/types/block';
import type { SetupBlock, SetupBlockInput } from '@/features/block/types/blockSetup';

/** 유형별 값을 홈 블록 규칙(BlockRule) 모양으로 옮긴다. 사용형은 규칙이 없다. */
function toBlockRule(block: SetupBlock): BlockRule | null {
    switch (block.type) {
        case 'FIXED':
            return {
                pay_day: block.payDay,
                pay_amount: block.amount,
                monthly_target: null,
                // 받는 분만 조건으로 보낸다. 금액 범위는 서버가 찾아 준 표시용 값이다.
                match_condition: block.paymentMatch?.counterparty ?? null,
            };
        case 'GOAL':
            return {
                pay_day: null,
                pay_amount: null,
                monthly_target: block.amount,
                match_condition: null,
            };
        case 'SPENDING':
            return null;
    }
}

/** 요청에 담긴 블록 금액 (SetupBlock.amount와 같은 값). 사용형은 한 달 금액, 그 외는 규칙 금액이다. */
export function getSetupBlockInputAmount(input: SetupBlockInput): number | null {
    return input.monthlyBudget ?? input.rule?.pay_amount ?? input.rule?.monthly_target ?? null;
}

/** 화면에서 고친 블록을 요청 모양으로 바꾼다. 유형에 안 쓰는 값은 비워서 보낸다. */
export function toSetupBlockInput(block: SetupBlock, index: number): SetupBlockInput {
    const isSpending = block.type === 'SPENDING';

    return {
        key: block.key,
        type: block.type,
        name: block.name.trim(),
        color: block.color,
        isDefault: block.isDefault,
        createdBy: block.createdBy,
        displayOrder: index,
        targetAmount: block.type === 'GOAL' ? block.targetAmount : null,
        rule: toBlockRule(block),
        monthlyBudget: isSpending ? block.amount : null,
        periodStartDay: isSpending ? (block.periodStartDay ?? 1) : null,
        notifyShortage: block.type === 'FIXED' && block.notifyShortage,
    };
}
