import type { BlockDetailAction } from '@/features/block/types/blockDetail';
import type { BlockResponse } from '@/features/block/types/homeResponse';

/**
 * GET /blocks/{blockId} 응답 (Back_end BlockDetailResponse, API 명세 v4 6장)
 * 화면은 BlockDetail을 쓰고, 이 응답은 blockDetailMapper에서 BlockDetail로 바꾼다.
 */
export interface BlockDetailResponse {
    block: BlockResponse;
    /** '왜 주의인가요?' 문장. 상태 판정(F-11) 전이라 지금은 항상 null */
    statusReason: string | null;
    /** 화면 버튼 (POSTPONE_DUE_DATE, PUT_WAITING_FUND, OPEN_SAVING_SUGGESTIONS, FILL_FROM_OTHER) */
    actions: BlockDetailAction[];
    /** 규칙 한 줄 */
    ruleText: string | null;
    /** 블록 유형(block.type)에 따라 모양이 다르다. */
    detail: SpendingDetailResponse | GoalDetailResponse | FixedDetailResponse;
}

/** 블록 기록 한 줄 (Back_end BlockHistoryResponse.Item) */
export interface BlockHistoryItemResponse {
    /** yyyy-MM-dd */
    date: string;
    kind: 'ALLOCATION' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'SAVING' | 'PAYMENT' | 'CREATED';
    title: string;
    subTitle: string | null;
    /** 들어오면 +, 나가면 - */
    amount: number;
}

/** 블록 상세에 쓰는 거래 필드만 (Back_end TransactionResponse) */
export interface BlockTransactionResponse {
    transactionId: number;
    /** 오프셋 없는 한국 시간 */
    occurredAt: string;
    amount: number;
    direction: 'IN' | 'OUT';
    merchantOrPayee: string | null;
    category: { categoryId: number; code: string; name: string } | null;
    /** 맥락 답변 표시용. 태그 목록(F-15)이 정해지기 전까지 null */
    contextTagLabel: string | null;
}

/** 사용형 상세 (02) */
export interface SpendingDetailResponse {
    period: { from: string; to: string };
    /** 남은 비율(%) = 잔액 ÷ 월 배분액 */
    remainingRate: number | null;
    /** 기간 남은 일수 (오늘 포함) */
    remainingDays: number;
    today: { available: number; spent: number; remaining: number };
    /** 월 배분액이 없으면 null */
    burn: {
        /** (실제 − 계획) ÷ 계획 × 100. 양수면 빨리 씀 */
        paceDiffRate: number | null;
        paceLabel: string | null;
        actualSpent: number;
        /** 기간 시작부터 오늘까지 하루 한 점 (그날까지의 누적) */
        series: { date: string; planned: number; actual: number }[];
        expectedDepletionDate: string | null;
    } | null;
    /** 최대 5건, 최신순 */
    recentTransactions: BlockTransactionResponse[];
}

/** 목표형 상세 (02-1) */
export interface GoalDetailResponse {
    achievementRate: number;
    thisMonth: {
        /** 월 확보 금액. 정하지 않았으면 null */
        target: number | null;
        secured: number;
        needed: number;
    };
    projection: {
        /** 목표 기한 */
        onTargetDate: string | null;
        /** 지금 속도면 다 모이는 날. 월 확보 금액이 없으면 null */
        currentPaceDate: string | null;
        /** 기한보다 늦는 일수 (빠르면 음수) */
        delayDays: number | null;
        /** 예: 목표보다 2주 늦음 */
        label: string | null;
        /** 월별 누적 (yyyy-MM). projected면 예상 구간 */
        series: { month: string; cumulative: number; projected: boolean }[];
    };
    /** 최근 들어온 돈 (최대 3건) */
    recentInflows: BlockHistoryItemResponse[];
    /** ACHIEVED · EXPIRED · null */
    resolutionNeeded: 'ACHIEVED' | 'EXPIRED' | null;
}

/** 납부 확인 조건 (Back_end BlockRule.MatchCondition). 값이 없는 키는 오지 않는다. */
export interface MatchConditionResponse {
    payee?: string;
    /** EXACT: 그대로, RANGE: 범위 */
    amountMode?: 'EXACT' | 'RANGE';
    minAmount?: number;
    maxAmount?: number;
    /** 납부일 앞뒤 허용 일수 */
    dayWindow?: number;
    linkedAccountId?: number;
}

/** 고정지출 알림 설정 (Back_end BlockRule.Alerts) */
export interface FixedAlertsResponse {
    shortageBefore3Days?: boolean | null;
    askFillFromOther?: boolean | null;
    paidConfirmed?: boolean | null;
}

/** 고정지출형 상세 (02-2) */
export interface FixedDetailResponse {
    securedRate: number;
    /** 납부일을 정하지 않았으면 null */
    nextPayDate: string | null;
    payAmount: number;
    shortage: number;
    matchCondition: MatchConditionResponse | null;
    alerts: FixedAlertsResponse | null;
    onTimeStreak: number;
    /** 최대 6건, 최신순 */
    recentPayments: {
        date: string;
        payee: string | null;
        /** 예: 국민은행 ••34. 현금 입력이면 null */
        account: string | null;
        amount: number;
        onTime: boolean;
    }[];
}
