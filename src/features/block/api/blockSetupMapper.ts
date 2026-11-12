import type {
    BlockSetupPreview,
    BlockSetupProposal,
    BlockSetupRequest,
    SetupBlock,
    SetupBlockInput,
} from '@/features/block/types/blockSetup';
import type {
    BlockProposal,
    BlockProposalConfirmItem,
    BlockProposalPreviewItem,
    BlockProposalPreviewResponse,
    BlockProposalResponse,
    ProposalRule,
} from '@/features/block/types/blockProposalResponse';
import type { BlockColorCode } from '@/features/block/types/homeResponse';
import type { BlockColor } from '@/shared/components/ui/BlockBeaker';

import { getSetupBlockInputAmount } from '@/features/block/utils/setupBlockInput';

/**
 * 온보딩 블록 구성 API 응답·요청을 화면 모양과 서로 바꾼다.
 * - 구성안(GET /blocks/proposals) → BlockSetupProposal
 * - 고친 블록(BlockSetupRequest) → 확정 요청(POST /blocks/proposals/confirm)
 */

/** 화면에서 고치는 금액. 사용형=한 달 금액, 고정지출형=납부액, 목표형=한 달 모을 금액 */
function toProposalAmount({ type, rule, balance }: BlockProposal) {
    switch (type) {
        case 'SPENDING':
            return rule?.monthlyAmount ?? balance;
        case 'FIXED':
            return rule?.payAmount ?? balance;
        case 'GOAL':
            return rule?.monthlyTarget ?? null;
    }
}

function toSetupBlock(proposal: BlockProposal): SetupBlock {
    const { rule } = proposal;
    const match = rule?.matchCondition;
    return {
        key: proposal.proposalKey,
        type: proposal.type,
        name: proposal.name,
        color: proposal.color.toLowerCase() as BlockColor,
        isDefault: proposal.isDefault,
        // 서버 구성안에서 온 블록 (기본 블록이 아니면 화면에 '거래에서 찾음'으로 보인다)
        createdBy: 'AI',
        reason: proposal.reason ? { text: proposal.reason, highlights: [] } : null,
        amount: toProposalAmount(proposal),
        // 서버는 목표형을 제안하지 않는다. (저축·비상금·여행은 직접 추가)
        targetAmount: null,
        dueDate: null,
        payDay: rule?.payDay ?? null,
        paymentMatch:
            match?.payee && match.minAmount != null && match.maxAmount != null
                ? {
                      counterparty: match.payee,
                      minAmount: match.minAmount,
                      maxAmount: match.maxAmount,
                  }
                : null,
        notifyShortage: rule?.alerts?.shortageBefore3Days ?? true,
        periodStartDay: rule?.startDay ?? null,
    };
}

export function toBlockSetupProposal(response: BlockProposalResponse): BlockSetupProposal {
    return {
        monthlyIncome: response.summary.monthlyAvgIncome,
        recurringPaymentCount: response.summary.recurringCount,
        linkedBalance: response.summary.linkedBalance,
        blocks: response.proposals.map(toSetupBlock),
    };
}

function toProposalRule(input: SetupBlockInput, amount: number | null): ProposalRule | null {
    switch (input.type) {
        case 'SPENDING':
            return { monthlyAmount: amount, startDay: input.periodStartDay ?? 1 };
        case 'GOAL':
            return { monthlyTarget: amount };
        case 'FIXED': {
            const match = input.paymentMatch;
            return {
                payDay: input.rule?.pay_day ?? null,
                payAmount: amount,
                matchCondition: match && {
                    payee: match.counterparty,
                    amountMode: match.minAmount === match.maxAmount ? 'EXACT' : 'RANGE',
                    minAmount: match.minAmount,
                    maxAmount: match.maxAmount,
                },
                alerts: { shortageBefore3Days: input.notifyShortage },
            };
        }
    }
}

/**
 * 확정 요청 블록. 화면 순서대로 보내면 그 순서가 홈 블록 순서가 된다.
 * 처음 넣을 금액(balance)은 화면에서 고친 금액을 그대로 보낸다.
 */
export function toConfirmItems(request: BlockSetupRequest): BlockProposalConfirmItem[] {
    return request.blocks.map((input) => {
        const amount = getSetupBlockInputAmount(input);
        return {
            type: input.type,
            name: input.name,
            color: input.color.toUpperCase() as BlockColorCode,
            balance: amount ?? 0,
            targetAmount: input.targetAmount,
            dueDate: input.dueDate,
            rule: toProposalRule(input, amount),
            isDefault: input.isDefault,
            createdBy: input.createdBy,
        };
    });
}

/** 미리보기 요청 블록. 확정 요청과 같은 모양에 구성안 키를 붙인다. */
export function toPreviewItems(request: BlockSetupRequest): BlockProposalPreviewItem[] {
    const items = toConfirmItems(request);
    return items.map((item, index) => ({ ...item, proposalKey: request.blocks[index].key }));
}

export function toBlockSetupPreview(response: BlockProposalPreviewResponse): BlockSetupPreview {
    return {
        linkedBalance: response.linkedBalance,
        allocatedAmount: response.allocated,
        remainingAmount: response.unallocated,
        blocks: response.blocks.map((block) => ({
            key: block.proposalKey,
            dailyBudget: block.dailyApprox,
            warning: block.warning,
        })),
    };
}
