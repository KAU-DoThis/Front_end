import type { Block } from '@/features/block/types/block';

/**
 * GET /home 응답 (Back_end HomeResponse, API 명세 v4 5장)
 * 화면은 BlockHome을 쓰고, 이 응답은 blockHomeMapper에서 BlockHome으로 바꾼다.
 */
export interface HomeResponse {
    /** 잔액 기준일 (yyyy-MM-dd). 계좌 중 가장 오래 전에 갱신된 날, 계좌가 없으면 오늘 */
    asOf: string;
    /** 연동 은행 계좌 잔액 합 */
    totalBalance: number;
    /** 연동 은행 계좌 수 (카드는 빠짐) */
    linkedAccountCount: number;
    /** 오늘 쓸 수 있는 돈. 기본 블록이 없거나 기간이 지났으면 null */
    dailyGuide: HomeDailyGuide | null;
    accounts: HomeAccountItem[];
    /** 제안 배너. 아직 항상 null (제안 카드 규칙이 붙으면 채워짐) */
    suggestion: unknown;
    /** 나눌 돈 목록. 아직 항상 빈 배열 (나눌 돈 #16이 붙으면 채워짐) */
    waitingFunds: unknown[];
    /** 블록 합계 + 나눌 돈 > 실제 잔액이면 true */
    overAllocated: boolean;
    /** displayOrder 순. GET /blocks와 같은 형식 */
    blocks: Block[];
    /** 마지막 동기화 시각. 계좌 중 가장 오래된 값, 계좌가 없으면 null */
    lastSyncedAt: string | null;
    unreadNotificationCount: number;
    pendingQuestionCount: number;
}

export interface HomeDailyGuide {
    /** 기본 사용형 블록 */
    blockId: number;
    blockName: string;
    blockBalance: number;
    /** 아침 기준 금액 = 잔액 ÷ 남은 일수, 100원 단위 내림 */
    todayAvailable: number;
    todaySpent: number;
    todayRemaining: number;
    /** 오늘 포함 */
    remainingDays: number;
    /** BLOCK_PERIOD: 기본 블록 기간 기준 / NEXT_INCOME: 다음 입금까지 기준(설계 중) */
    basis: 'BLOCK_PERIOD' | 'NEXT_INCOME';
}

export interface HomeAccountItem {
    linkedAccountId: number;
    institutionCode: string;
    /** 지원 기관 목록에 없으면 null */
    institutionName: string | null;
    accountName: string | null;
    last4: string | null;
    balance: number | null;
    /** 이번 달 이 계좌에서 쓴 돈. 아직 항상 0 (거래가 붙으면 채워짐) */
    monthSpent: number;
}
