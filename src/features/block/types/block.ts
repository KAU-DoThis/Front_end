import type { BlockColor } from '@/shared/components/ui/BlockBeaker';
import type { Status } from '@/shared/components/ui/StatusTag';

/** 블록 유형 (Back_end BlockType) */
export type BlockType = 'SPENDING' | 'GOAL' | 'FIXED';

/** 블록 규칙. 유형별로 쓰는 값만 채워진다. (Back_end BlockRule, JSON 키가 snake_case) */
export interface BlockRule {
    /** 고정지출형 납부일 1~31 */
    pay_day: number | null;
    /** 고정지출형 납부액 */
    pay_amount: number | null;
    /** 목표형 월 확보 금액 */
    monthly_target: number | null;
    /** 고정지출형 거래 매칭 조건 (가맹점·수취인) */
    match_condition: string | null;
}

/** 블록 (Back_end BlockResponse 그대로) */
export interface Block {
    blockId: number;
    type: BlockType;
    name: string;
    icon: string | null;
    /** 잔액 (원) */
    balance: number;
    /** 기본 사용형 블록, 삭제 불가 */
    isDefault: boolean;
    /** 목표 금액 (목표형만) */
    targetAmount: number | null;
    /** yyyy-MM-dd */
    startDate: string;
    /** 사용형 = 기간 끝, 목표형 = 기한 (yyyy-MM-dd) */
    dueDate: string | null;
    rule: BlockRule | null;
    status: Status;
    createdBy: 'AI' | 'USER';
    displayOrder: number;
    categories: { categoryId: number; code: string; name: string }[];
}

/**
 * 홈 화면용 블록 = BlockResponse + 화면 표시 값
 * 아래 값은 백엔드에 아직 없다. 홈 API를 정할 때 같이 맞춘다.
 */
export interface HomeBlock extends Block {
    /** 블록 고정 색 (i·o·t·s·z·j·l) */
    color: BlockColor;
    /** 물 높이 0~100 — 사용형: 이번 기간 남은 비율, 목표형: 달성률, 고정지출형: 납부 전 100 */
    fillRate: number;
    /** 고정지출형 납부일까지 남은 날 (그 외 null) */
    daysUntilPay: number | null;
}
