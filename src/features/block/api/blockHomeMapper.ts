import type { HomeBlock } from '@/features/block/types/block';
import type { BlockHome, LinkedAccountSummary } from '@/features/block/types/blockHome';
import type {
    BlockResponse,
    HomeAccountItem,
    HomeResponse,
} from '@/features/block/types/homeResponse';
import type { BlockColor } from '@/shared/components/ui/BlockBeaker';

/**
 * 서버 홈 응답(HomeResponse)을 화면용 BlockHome으로 바꾼다.
 * 서버에 아직 없는 값은 여기서 임시로 채운다. 서버가 내려주기 시작하면 이 파일만 고친다.
 */

/**
 * 블록 객체(v4)를 화면 블록으로 바꾼다.
 * - 색은 서버가 대문자(I)로 주고 화면 토큰은 소문자(i)라 바꾼다.
 * - 물 높이는 capacity(월 배분액·목표 금액·납부액)가 없으면 null로 온다. (아래 fillRate 참고)
 * - 화면의 남은 일수(daysUntilPay)는 고정지출형 납부일 기준이라, 목표형 dDay는 쓰지 않는다.
 * - 규칙은 화면 타입이 아직 예전 snake_case 키라 옮겨 담는다.
 * TODO: 화면 Block 타입을 v4로 바꾸면 규칙 변환을 지운다. (온보딩 블록 구성 요청도 같이 바꿔야 함)
 */
function toHomeBlock(block: BlockResponse): HomeBlock {
    const { rule } = block;
    return {
        blockId: block.blockId,
        type: block.type,
        name: block.name,
        icon: block.icon,
        balance: block.balance,
        isDefault: block.isDefault,
        targetAmount: block.targetAmount,
        startDate: block.startDate,
        dueDate: block.dueDate,
        rule: rule && {
            pay_day: rule.payDay ?? null,
            pay_amount: rule.payAmount ?? null,
            monthly_target: rule.monthlyTarget ?? null,
            match_condition: rule.matchCondition?.payee ?? null,
        },
        status: block.status,
        createdBy: block.createdBy,
        displayOrder: block.displayOrder,
        categories: block.categories,
        color: block.color.toLowerCase() as BlockColor,
        // capacity가 없으면 서버가 비율을 주지 않는다. 잔액이 있으면 가득, 없으면 빈 비커로 그린다.
        fillRate: block.fillRate ?? (block.balance > 0 ? 100 : 0),
        daysUntilPay: block.type === 'FIXED' ? block.dDay : null,
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

export function toBlockHome(response: HomeResponse): BlockHome {
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
        pendingMoney: response.waitingFunds,
        // 홈 응답에는 없다. (거래 목록 summary.nextExpectedIncome, 입금원 분석 전까지 null)
        nextExpectedIncome: null,
        blocks: blocks.map(toHomeBlock),
        unreadNotificationCount: response.unreadNotificationCount,
    };
}
