import type { HomeBlock } from '@/features/block/types/block';

/**
 * 홈 화면 응답 (백엔드 API 미정 — 시안 01 홈 + DB 스키마 기준 목업 모양)
 * 계산 값(총 자산, 오늘 쓸 수 있는 돈 등)은 서버가 계산해 내려준다.
 */
export interface BlockHome {
    /** 은행 계좌 잔액 합 (카드는 잔액이 없어 빠진다) */
    totalAssets: number;
    /** 총 자산 기준 시각 — 계좌 잔액 갱신 시각 중 가장 오래된 값 (ISO 8601, 없으면 null) */
    balanceUpdatedAt: string | null;
    /** 오늘 쓸 수 있는 돈. 기본 사용형 블록이 없거나 기간이 지났으면 null */
    todayGuide: TodayGuide | null;
    /** 연동 계좌·카드 (총 자산 카드에서 넘겨 본다, 01-1) */
    accounts: LinkedAccountSummary[];
    /** 에이전트 배너 (없으면 null) */
    agentMessage: AgentMessage | null;
    /** 아직 블록에 나누지 않은 돈 (대기 블록) */
    pendingMoney: PendingMoney[];
    /**
     * 다음 정기 입금 예정 (입금원 분석 결과, 없으면 null)
     * API 명세 v4 거래 목록의 nextExpectedIncome과 같은 값 — 자금 이동 '자동 되돌리기' 문구에 쓴다.
     */
    nextExpectedIncome: NextExpectedIncome | null;
    blocks: HomeBlock[];
    /** 읽지 않은 알림 수 (헤더 알림 점). 알림함이 붙기 전까지 서버가 0으로 준다. */
    unreadNotificationCount: number;
}

/** 오늘 쓸 수 있는 돈과 그 근거가 된 기본 사용형 블록 */
export interface TodayGuide {
    /** 오늘 쓸 수 있는 돈 = 잔액 ÷ 남은 일수 (서버 계산) */
    available: number;
    blockName: string;
    balance: number;
    /** 기간 끝까지 남은 날 (오늘 포함) */
    remainingDays: number;
}

/** linked_accounts.type */
export type LinkedAccountType = 'BANK' | 'CARD';

/** linked_accounts.status */
export type LinkedAccountStatus = 'ACTIVE' | 'EXPIRED' | 'ERROR';

/** 연동 계좌 요약 (linked_accounts + 서버 계산 값) */
export interface LinkedAccountSummary {
    linkedAccountId: number;
    institutionCode: string;
    /** 기관 이름 (서버가 기관 코드로 붙여 준다. 예: KB국민) */
    institutionName: string;
    type: LinkedAccountType;
    /** 계좌·카드 이름 (예: KB마이핏통장) */
    accountName: string | null;
    accountNumberLast4: string | null;
    /** 카드는 null */
    balance: number | null;
    /** ISO 8601 */
    balanceUpdatedAt: string | null;
    status: LinkedAccountStatus;
    /** 이번 달 나간 돈 (카드는 이번 달 사용액) — 서버 계산 */
    monthlySpent: number;
}

export interface NextExpectedIncome {
    /** 예: 월급 */
    label: string;
    /** yyyy-MM-dd */
    expectedDate: string;
}

export interface AgentMessage {
    title: string;
    body: string;
}

/**
 * 나눌 돈 (대기 자금). 서버 WaitingFundResponse 그대로.
 * 금액이 0보다 큰 것만 오고, 다 나누면 목록에서 빠진다.
 */
export interface PendingMoney {
    waitingFundId: number;
    /** SAVING 절약분 · REGULAR_INCOME 정기 입금 · EXTRA_INCOME 추가 입금 · OTHER 기타 */
    source: 'SAVING' | 'REGULAR_INCOME' | 'EXTRA_INCOME' | 'OTHER';
    /** 카드 위 칩 문구 (예: 절약분) */
    label: string;
    /** 카드 아래 설명 (예: 9월 절약 확정) */
    description: string | null;
    /** 남은 금액 */
    amount: number;
    /** 처음 금액 */
    originalAmount: number;
    /** ISO 8601 */
    createdAt: string;
}
