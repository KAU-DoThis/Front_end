import type { FixedBlockDetail } from '@/features/block/types/blockDetail';
import type { PendingMoney } from '@/features/block/types/blockHome';
import type { BlockColorCode } from '@/features/block/types/homeResponse';
import type { BlockColor } from '@/shared/components/ui/BlockBeaker';

/**
 * 블록 수정 시트·알림 토글이 바꾸는 값 (화면 기준). 넣은 값만 보낸다.
 * blockUpdateMapper에서 서버 요청(BlockUpdateRequest)으로 바꾼다.
 */
export interface BlockPatch {
    name?: string;
    color?: BlockColor;
    /** 목표형 목표 금액 */
    targetAmount?: number;
    /** 목표형 기한 (yyyy-MM-dd) */
    dueDate?: string;
    /** 사용형 월 배분액 */
    monthlyAmount?: number;
    /** 사용형 기간 시작일 (매월 n일) */
    startDay?: number;
    /** 고정지출형 납부일 1~31 */
    payDay?: number;
    /** 고정지출형 납부액 */
    payAmount?: number;
    /** 고정지출형 알림. 넣은 키만 바뀐다. */
    alerts?: Partial<FixedBlockDetail['alerts']>;
}

/** PATCH /blocks/{blockId} 요청 (Back_end BlockUpdateRequest). 보낸 필드만 바뀌고 유형은 못 바꾼다. */
export interface BlockUpdateRequest {
    name?: string;
    color?: BlockColorCode;
    targetAmount?: number;
    dueDate?: string;
    /** 보낸 키만 바뀐다. alerts는 키별로 바뀐다. */
    rule?: {
        monthlyAmount?: number;
        startDay?: number;
        payDay?: number;
        payAmount?: number;
        alerts?: { shortageBefore3Days?: boolean; paidConfirmed?: boolean };
    };
    /** 조회한 블록 version. 그사이 바뀌었으면 409 BLOCK_VERSION_CONFLICT. 비우면 검사하지 않는다. */
    version?: number;
}

/** DELETE /blocks/{blockId} 응답 (Back_end BlockDeleteResponse) */
export interface BlockDeleteResponse {
    blockId: number;
    /** 나눌 돈으로 돌아간 금액 */
    returnedAmount: number;
    /** 잔액이 담긴 나눌 돈 (source OTHER). 잔액이 0이었으면 null */
    waitingFund: PendingMoney | null;
}
