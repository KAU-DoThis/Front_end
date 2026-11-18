import type { BlockType } from '@/features/block/types/block';
import type { BlockColorCode } from '@/features/block/types/homeResponse';
import type { BlockColor } from '@/shared/components/ui/BlockBeaker';

/**
 * 블록 추가 시트에서 고른 값 (화면 기준).
 * amount: 사용형 한 달 금액 · 목표형 목표 금액 · 고정지출형 납부액
 * day: 사용형 기간 시작일 · 고정지출형 납부일
 */
export interface NewBlock {
    type: BlockType;
    name: string;
    color: BlockColor;
    amount: number;
    day: number | null;
    /** 목표형 기한 (yyyy-MM-dd) */
    dueDate: string | null;
}

/**
 * POST /blocks 요청 (Back_end BlockCreateRequest).
 * 잔액 0원으로 만들어진다. 목표형은 targetAmount·dueDate, 고정지출형은 rule.payDay·payAmount가 필수.
 */
export interface BlockCreateRequest {
    type: BlockType;
    name: string;
    color?: BlockColorCode;
    targetAmount?: number;
    dueDate?: string;
    rule?: {
        monthlyAmount?: number;
        startDay?: number;
        payDay?: number;
        payAmount?: number;
    };
}
