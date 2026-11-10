import type {
    BlockSetupPreview,
    BlockSetupProposal,
    BlockSetupRequest,
    SetupBlockInput,
} from '@/features/block/types/blockSetup';
import { formatAmount } from '@/lib/format';

/**
 * 온보딩 블록 구성 목업 (시안 04 블록 구성 값)
 * 통신비·구독의 근거 문장과 납부 조건은 시안에 없어 임의로 채웠다.
 */
export const BLOCK_SETUP_PROPOSAL_MOCK: BlockSetupProposal = {
    monthlyIncome: 3_500_000,
    recurringPaymentCount: 3,
    blocks: [
        {
            key: 'proposal-rent',
            type: 'FIXED',
            name: '월세',
            color: 'l',
            isDefault: false,
            createdBy: 'AI',
            reason: {
                text: '지난 3개월 매월 25일 전후 김OO님께 60만 원을 보냈어요',
                highlights: ['김OO님께 60만 원'],
            },
            amount: 600_000,
            targetAmount: null,
            dueDate: null,
            payDay: 25,
            paymentMatch: { counterparty: '김*수', minAmount: 540_000, maxAmount: 660_000 },
            notifyShortage: true,
            periodStartDay: null,
        },
        {
            key: 'proposal-living',
            type: 'SPENDING',
            name: '생활비',
            color: 'i',
            isDefault: true,
            createdBy: 'AI',
            reason: {
                text: '최근 3달 평균 1,620,000원 썼어요. 월세·통신비를 빼고 남는 돈 기준으로 잡았어요',
                highlights: ['1,620,000원'],
            },
            amount: 1_500_000,
            targetAmount: null,
            dueDate: null,
            payDay: null,
            paymentMatch: null,
            notifyShortage: false,
            periodStartDay: 1,
        },
        {
            key: 'proposal-phone',
            type: 'FIXED',
            name: '통신비',
            color: 'z',
            isDefault: false,
            createdBy: 'AI',
            reason: {
                text: '지난 3개월 매월 15일 SK텔레콤으로 55,000원이 나갔어요',
                highlights: ['SK텔레콤으로 55,000원'],
            },
            amount: 55_000,
            targetAmount: null,
            dueDate: null,
            payDay: 15,
            paymentMatch: { counterparty: 'SK텔레콤', minAmount: 49_500, maxAmount: 60_500 },
            notifyShortage: true,
            periodStartDay: null,
        },
        {
            key: 'proposal-subscription',
            type: 'FIXED',
            name: '구독',
            color: 's',
            isDefault: false,
            createdBy: 'AI',
            reason: {
                text: '지난 3개월 매월 3일 넷플릭스로 17,000원이 나갔어요',
                highlights: ['넷플릭스로 17,000원'],
            },
            amount: 17_000,
            targetAmount: null,
            dueDate: null,
            payDay: 3,
            paymentMatch: { counterparty: '넷플릭스', minAmount: 15_300, maxAmount: 18_700 },
            notifyShortage: true,
            periodStartDay: null,
        },
    ],
};

const LINKED_BALANCE_MOCK = 4_920_000;

/** 사용형 블록의 최근 3달 평균 지출 (목업: 생활비만) */
const AVERAGE_SPENDING_MOCK: Record<string, number> = { 'proposal-living': 1_620_000 };

/**
 * 미리보기 목업. 실제로는 서버가 계산한다. (화면은 이 결과를 그대로 쓴다)
 * 나눈 돈은 사용형 한 달 금액 · 고정지출형 납부 금액 · 목표형 한 달 모을 금액의 합이다.
 * 하루 쓸 돈은 이번 달 날 수로 나눠 100원 아래를 버린다.
 */
export function mockBlockSetupPreview({ blocks }: BlockSetupRequest): BlockSetupPreview {
    const getMonthlyAmount = (block: SetupBlockInput) =>
        block.monthlyBudget ?? block.rule?.pay_amount ?? block.rule?.monthly_target ?? 0;
    const allocatedAmount = blocks.reduce((sum, block) => sum + getMonthlyAmount(block), 0);
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    return {
        linkedBalance: LINKED_BALANCE_MOCK,
        allocatedAmount,
        remainingAmount: LINKED_BALANCE_MOCK - allocatedAmount,
        blocks: blocks.map((block) => {
            if (block.type !== 'SPENDING' || block.monthlyBudget === null) {
                return { key: block.key, dailyBudget: null, warning: null };
            }
            const average = AVERAGE_SPENDING_MOCK[block.key];
            const shortfall = average === undefined ? 0 : average - block.monthlyBudget;
            return {
                key: block.key,
                dailyBudget: Math.floor(block.monthlyBudget / daysInMonth / 100) * 100,
                warning:
                    shortfall > 0
                        ? `최근 3달 평균보다 ${formatAmount(shortfall)} 적어요. 소진 주의 알림이 자주 올 수 있어요.`
                        : null,
            };
        }),
    };
}
