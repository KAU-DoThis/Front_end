import type { HomeBlock } from '@/features/block/types/block';

/**
 * 홈 화면 응답 (백엔드 API 미정 — 시안 01 홈 기준 목업 모양)
 * 계산 값(총 자산, 오늘 쓸 수 있는 돈 등)은 서버가 계산해 내려준다.
 */
export interface BlockHome {
    /** 잔액 기준일 (yyyy-MM-dd) */
    baseDate: string;
    /** 연동 계좌 전체 합 */
    totalAssets: number;
    /** 오늘 쓸 수 있는 돈 */
    todayAvailable: number;
    /** 오늘 쓸 수 있는 돈의 근거가 된 사용형 블록 */
    todayBasis: {
        blockName: string;
        balance: number;
        /** 기간 끝까지 남은 날 */
        remainingDays: number;
    };
    /** 총 자산 카드에서 넘겨 보는 계좌별 카드 (01-1) */
    accounts: AccountSummary[];
    /** 에이전트 배너 (없으면 null) */
    agentMessage: AgentMessage | null;
    /** 아직 블록에 나누지 않은 돈 (대기 블록) */
    pendingMoney: PendingMoney[];
    blocks: HomeBlock[];
}

export interface AccountSummary {
    accountId: number;
    /** 예: KB국민 */
    bankName: string;
    /** 예: 입출금 */
    accountType: string;
    /** 계좌번호 뒤 4자리 */
    accountNumberTail: string;
    balance: number;
    /** 이번 달 나간 돈 */
    monthlySpent: number;
}

export interface AgentMessage {
    title: string;
    body: string;
}

/** SAVING: 절약분, DEPOSIT: 추가 입금 */
export type PendingMoneySource = 'SAVING' | 'DEPOSIT';

export interface PendingMoney {
    pendingId: number;
    source: PendingMoneySource;
    amount: number;
    /** 절약분은 절약한 달, 추가 입금은 입금일 (yyyy-MM-dd) */
    occurredAt: string;
}
