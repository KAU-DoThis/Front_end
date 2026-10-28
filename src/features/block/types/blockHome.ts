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
    /** 오늘 쓸 수 있는 돈 */
    todayAvailable: number;
    /** 오늘 쓸 수 있는 돈의 근거가 된 사용형 블록 */
    todayBasis: {
        blockName: string;
        balance: number;
        /** 기간 끝까지 남은 날 */
        remainingDays: number;
    };
    /** 연동 계좌·카드 (총 자산 카드에서 넘겨 본다, 01-1) */
    accounts: LinkedAccountSummary[];
    /** 에이전트 배너 (없으면 null) */
    agentMessage: AgentMessage | null;
    /** 아직 블록에 나누지 않은 돈 (대기 블록) */
    pendingMoney: PendingMoney[];
    blocks: HomeBlock[];
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

export interface AgentMessage {
    title: string;
    body: string;
}

/**
 * 나눌 돈 (대기 블록). 저장 테이블이 따로 없고 서버가 모아서 내려준다.
 * - SAVING: 절약분 — saving_goals 중 status CONFIRMED (confirmed_saving)
 * - DEPOSIT: 추가 입금 — 미배분 잔액 (은행 잔액 합 − 블록 잔액 합)
 */
export type PendingMoney =
    | {
          source: 'SAVING';
          savingGoalId: number;
          amount: number;
          /** 절약 기간 끝 (saving_goals.end_date, yyyy-MM-dd) */
          periodEndDate: string;
      }
    | {
          source: 'DEPOSIT';
          amount: number;
          /** 마지막 입금 시각 (ISO 8601, 없으면 null) */
          lastDepositAt: string | null;
      };
