import type { BlockType } from '@/features/block/types/block';
import type { PendingMoney } from '@/features/block/types/blockHome';
import type { Status } from '@/shared/components/ui/StatusTag';

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
    /** 나눌 돈. 금액이 0보다 큰 것만, 비어 있으면 영역을 숨긴다 */
    waitingFunds: PendingMoney[];
    /** 블록 합계 + 나눌 돈 > 실제 잔액이면 true */
    overAllocated: boolean;
    /** displayOrder 순. GET /blocks와 같은 형식 */
    blocks: BlockResponse[];
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

/** 블록 색 코드 (서버는 대문자) */
export type BlockColorCode = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

/** 블록 규칙 (v4, camelCase). 유형별로 필요한 값만 온다. */
export interface BlockRuleResponse {
    /** 사용형 월 배분액 */
    monthlyAmount?: number;
    /** 사용형 기간 시작일 (매월 n일) */
    startDay?: number;
    /** 목표형 월 확보 금액 */
    monthlyTarget?: number;
    /** 고정지출형 납부일 1~31 */
    payDay?: number;
    /** 고정지출형 납부액 */
    payAmount?: number;
    /** 고정지출형 납부 확인 조건 */
    matchCondition?: { payee?: string | null } | null;
}

/** 블록 객체 (Back_end BlockResponse, API 명세 v4 0장) */
export interface BlockResponse {
    blockId: number;
    type: BlockType;
    name: string;
    icon: string | null;
    color: BlockColorCode;
    balance: number;
    /** 비커 크기 기준 금액. 사용형=월 배분액, 목표형=목표 금액, 고정지출형=납부액. 정하지 않았으면 null */
    capacity: number | null;
    /** 물 높이 0~100 = 잔액 ÷ capacity. capacity가 없으면 null */
    fillRate: number | null;
    isDefault: boolean;
    targetAmount: number | null;
    startDate: string;
    dueDate: string | null;
    /** 고정지출형=다음 납부일까지, 목표형=목표일까지 남은 일수. 사용형 null */
    dDay: number | null;
    rule: BlockRuleResponse | null;
    status: Status;
    /** 상태 라벨 (예: 주의) */
    statusLabel: string;
    /** 상태 칩 옆 짧은 이유. 없으면 null */
    statusSubLabel: string | null;
    displayOrder: number;
    createdBy: 'AI' | 'USER';
    /** 낙관적 잠금 버전. 수정·이동 요청에 그대로 보낸다 */
    version: number;
    categories: { categoryId: number; code: string; name: string }[];
}
