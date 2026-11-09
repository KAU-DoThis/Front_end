import type { HomeBlock } from '@/features/block/types/block';

/**
 * 블록 상세 화면 데이터. 서버 응답(GET /blocks/{blockId})은 blockDetailMapper에서 이 모양으로 바꾼다.
 * 블록 정보는 홈과 같은 HomeBlock, 나머지는 서버 계산 값이다.
 */
interface BlockDetailBase {
    block: HomeBlock;
    /** 상태 칩 옆 이유 (예: 소진 빠름, 2주 늦어짐) */
    statusReason: string | null;
    /** '왜 주의인가요?' 설명 (안전이면 null) */
    explanation: string | null;
    /** 규칙 한 줄 (예: 목표 800,000 · 12월 31일 · 매달 200,000). 서버가 만들어 준다. */
    ruleText: string | null;
}

/** 블록에 걸린 거래 (transactions 테이블 기준) */
export interface BlockTransaction {
    transactionId: number;
    /** ISO 8601 */
    occurredAt: string;
    /** 양수 금액 — 방향은 direction으로 본다. */
    amount: number;
    direction: 'IN' | 'OUT';
    merchantOrPayee: string | null;
    categoryName: string | null;
    /** 맥락 태그 (예: 야근) */
    contextTag: string | null;
}

/** 사용형 (02 생활비) */
export interface SpendingBlockDetail extends BlockDetailBase {
    type: 'SPENDING';
    /** 이번 기간 배분 금액 */
    allocatedAmount: number;
    /** 이번 기간 (yyyy-MM-dd) */
    periodStartDate: string;
    periodEndDate: string;
    /** 기간 끝까지 남은 날 (오늘 포함) */
    remainingDays: number;
    today: {
        /** 오늘 쓸 수 있는 돈 */
        available: number;
        spent: number;
        remaining: number;
    };
    /** 소진 속도. 월 배분액이 없으면 null (카드를 그리지 않는다) */
    burnRate: {
        /** 계획 대비 빠르기 % (+ 빠름, − 느림) */
        diffPercent: number;
        /** 예: 계획보다 17% 빠름 */
        paceText: string;
        /** 이번 기간 실제 사용 */
        spentAmount: number;
        /** 계획선 끝 금액 (기간 끝까지 쓸 계획) */
        plannedAmount: number;
        /** 기간 일수 */
        totalDays: number;
        /** 누적 사용액 (day: 기간 시작부터 지난 날) */
        actual: { day: number; amount: number }[];
    } | null;
    recentTransactions: BlockTransaction[];
}

/** 목표형 블록에 들어온 돈 (block_transfers 기준) */
export interface BlockInflow {
    /** 예: 10월 블록 배분, 여행 블록 만듦 */
    title: string;
    /** 예: 월급에서, 첫 배분 */
    note: string | null;
    /** yyyy-MM-dd 또는 ISO 8601 */
    occurredAt: string;
    amount: number;
}

/** 목표형 (02-1 여행) */
export interface GoalBlockDetail extends BlockDetailBase {
    type: 'GOAL';
    targetAmount: number;
    /** 기한까지 남은 날 (기한이 없으면 null) */
    daysLeft: number | null;
    monthly: {
        /** 이번 달 목표 (rule.monthly_target). 정하지 않았으면 null */
        target: number | null;
        saved: number;
        /** 더 필요 */
        remaining: number;
    };
    /** 목표 도착 예상 (기한이 없으면 null) */
    projection: {
        /** 예: 목표보다 2주 늦음 */
        paceText: string;
        isLate: boolean;
        /** 지금 속도로 다 모이는 날 (yyyy-MM-dd) */
        expectedDate: string;
        /** 예: 1월 중순 */
        expectedLabel: string;
        /** 차트 x축 첫 달·마지막 달 (yyyy-MM) */
        startMonth: string;
        endMonth: string;
        /** 모은 돈 누적 (yyyy-MM-dd) */
        saved: { date: string; amount: number }[];
    } | null;
    inflows: BlockInflow[];
}

/** 고정지출형 납부 기록 (조건에 맞아 '납부 완료'로 처리된 출금) */
export interface BlockPayment {
    /** yyyy-MM-dd 또는 ISO 8601 */
    paidAt: string;
    payee: string | null;
    /** 예: 국민 ••34. 현금 입력이면 null */
    accountLabel: string | null;
    amount: number;
}

/** 고정지출형 (02-2 월세) */
export interface FixedBlockDetail extends BlockDetailBase {
    type: 'FIXED';
    /** 다음 납부일 (yyyy-MM-dd). 납부일을 정하지 않았으면 null */
    nextPayDate: string | null;
    payAmount: number;
    /** 모자란 돈 */
    shortfall: number;
    /** 납부 확인 조건 (rule.matchCondition). 조건이 없으면 null (카드를 그리지 않는다) */
    matchRule: {
        payee: string | null;
        /** 예: 600,000원 그대로 */
        amountText: string | null;
        /** 예: 매월 25일 앞뒤 3일 */
        dateText: string | null;
        /** 예: 국민 ••34. 서버가 계좌 이름을 주기 전까지 null */
        accountLabel: string | null;
    } | null;
    /** 블록별 알림 설정 */
    alerts: {
        /** 납부 3일 전까지 모자라면 알려주기 */
        shortageBeforePay: boolean;
        /** 납부 확인되면 알려주기 */
        paymentConfirmed: boolean;
    };
    /** 연속으로 제때 낸 달 수 */
    onTimeStreak: number;
    payments: BlockPayment[];
}

export type BlockDetail = SpendingBlockDetail | GoalBlockDetail | FixedBlockDetail;
