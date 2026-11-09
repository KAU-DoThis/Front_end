import type { Block, HomeBlock } from '@/features/block/types/block';
import type { BlockHome, LinkedAccountSummary } from '@/features/block/types/blockHome';
import type { HomeAccountItem, HomeResponse } from '@/features/block/types/homeResponse';
import type { BlockColor } from '@/shared/components/ui/BlockBeaker';

/**
 * 서버 홈 응답(HomeResponse)을 화면용 BlockHome으로 바꾼다.
 * 서버에 아직 없는 값은 여기서 임시로 채운다. 서버가 내려주기 시작하면 이 파일만 고친다.
 */

/** 블록 색 순서. 서버가 색을 내려주기 전까지 displayOrder 순으로 돌려 쓴다. */
const BLOCK_COLOR_ORDER: BlockColor[] = ['i', 'j', 'o', 'l', 't', 's', 'z'];

const DAY_MS = 24 * 60 * 60 * 1000;

function clampPercent(value: number) {
    return Math.min(100, Math.max(0, Math.round(value)));
}

/**
 * 물 높이 0~100 (임시 계산)
 * - 목표형: 잔액 ÷ 목표 금액
 * - 고정지출형: 잔액 ÷ 납부액
 * - 사용형: 이번 기간 배분 금액이 응답에 없어 100으로 둔다.
 * TODO: v4 블록 객체(이건하 #15·#40·#44)에 fillRate가 들어오면 서버 값을 쓴다.
 */
function getFillRate(block: Block) {
    if (block.type === 'GOAL' && block.targetAmount) {
        return clampPercent((block.balance / block.targetAmount) * 100);
    }
    if (block.type === 'FIXED' && block.rule?.pay_amount) {
        return clampPercent((block.balance / block.rule.pay_amount) * 100);
    }
    return 100;
}

/**
 * 고정지출형 납부일까지 남은 날 (오늘이면 0). 납부일이 이번 달에 없으면(31일 등) 말일로 본다.
 * TODO: 서버가 daysUntilPay를 내려주면 지운다.
 */
function getDaysUntilPay(block: Block, today: Date) {
    const payDay = block.rule?.pay_day;
    if (block.type !== 'FIXED' || !payDay) {
        return null;
    }
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const payDateIn = (monthOffset: number) => {
        const lastDay = new Date(start.getFullYear(), start.getMonth() + monthOffset + 1, 0);
        return new Date(
            lastDay.getFullYear(),
            lastDay.getMonth(),
            Math.min(payDay, lastDay.getDate()),
        );
    };
    const thisMonth = payDateIn(0);
    const next = thisMonth >= start ? thisMonth : payDateIn(1);
    return Math.round((next.getTime() - start.getTime()) / DAY_MS);
}

function toHomeBlock(block: Block, index: number, today: Date): HomeBlock {
    return {
        ...block,
        color: BLOCK_COLOR_ORDER[index % BLOCK_COLOR_ORDER.length],
        fillRate: getFillRate(block),
        daysUntilPay: getDaysUntilPay(block, today),
    };
}

/**
 * 홈 응답의 계좌는 은행 계좌만 온다. 종류·상태·갱신 시각은 아직 응답에 없어 임시로 채운다.
 * TODO: 서버가 type·status·balanceUpdatedAt을 내려주면 그 값을 쓴다.
 */
function toAccountSummary(
    account: HomeAccountItem,
    lastSyncedAt: string | null,
): LinkedAccountSummary {
    return {
        linkedAccountId: account.linkedAccountId,
        institutionCode: account.institutionCode,
        // 지원 목록에 없는 기관은 이름이 안 와서 기관 코드라도 보여준다.
        institutionName: account.institutionName ?? account.institutionCode,
        type: 'BANK',
        accountName: account.accountName,
        accountNumberLast4: account.last4,
        balance: account.balance,
        balanceUpdatedAt: lastSyncedAt,
        status: 'ACTIVE',
        monthlySpent: account.monthSpent,
    };
}

export function toBlockHome(response: HomeResponse, today: Date = new Date()): BlockHome {
    const { dailyGuide } = response;
    const blocks = [...response.blocks].sort((a, b) => a.displayOrder - b.displayOrder);

    return {
        totalAssets: response.totalBalance,
        balanceUpdatedAt: response.lastSyncedAt,
        todayGuide: dailyGuide && {
            available: dailyGuide.todayAvailable,
            blockName: dailyGuide.blockName,
            balance: dailyGuide.blockBalance,
            remainingDays: dailyGuide.remainingDays,
        },
        accounts: response.accounts.map((account) =>
            toAccountSummary(account, response.lastSyncedAt),
        ),
        // TODO: 제안 카드 규칙이 붙으면 suggestion을 배너 문구로 바꾼다.
        agentMessage: null,
        // TODO: 나눌 돈(#16)이 붙으면 waitingFunds를 바꿔 넣는다.
        pendingMoney: [],
        // 홈 응답에는 없다. (거래 목록 summary.nextExpectedIncome, 입금원 분석 전까지 null)
        nextExpectedIncome: null,
        blocks: blocks.map((block, index) => toHomeBlock(block, index, today)),
        unreadNotificationCount: response.unreadNotificationCount,
    };
}
