import type { PendingMoney } from '@/features/block/types/blockHome';
import type { TransferResultBlock } from '@/features/block/types/blockTransfer';

/**
 * 나눌 돈(대기 자금) 목록·배분 (Back_end WaitingFundController, API 명세 v4 6-1장)
 * 목록 한 건은 홈과 같은 PendingMoney(서버 WaitingFundResponse 그대로)다.
 */

/** GET /waiting-funds */
export interface WaitingFundListResponse {
    /** 남은 금액이 있는 것만, 생긴 순서 */
    waitingFunds: PendingMoney[];
    /** 남은 금액 합계 */
    total: number;
}

/** 남은 돈 처리. KEEP: 나눌 돈에 남김(기본), DEFAULT_BLOCK: 생활비(기본 블록)에 넣기 */
export type LeftoverTo = 'KEEP' | 'DEFAULT_BLOCK';

/** POST /waiting-funds/{waitingFundId}/allocations */
export interface AllocationRequest {
    allocations: {
        blockId: number;
        amount: number;
        /** 미리보기(POST /blocks/simulate)에서 받은 블록 version. 바뀌었으면 409 */
        version: number;
    }[];
    leftoverTo?: LeftoverTo;
    /** 다음 정기 입금부터 이대로 나누기. 서버가 아직 저장하지 않는다. */
    autoAllocateNextTime?: boolean;
}

export interface AllocationResponse {
    waitingFund: {
        waitingFundId: number;
        /** 남은 금액. 0이면 홈 카드가 사라진다. */
        amount: number;
    };
    /** 배분받은 블록 */
    blocks: TransferResultBlock[];
    /** 기본 사용형 블록 기준 오늘 쓸 수 있는 돈 */
    dailyGuide: { todayAvailable: number; todayRemaining: number } | null;
}

/** 배분 에러 코드 — 화면 분기는 ApiError.code로 한다. */
export const WAITING_FUND_ERROR_CODE = {
    NOT_FOUND: 'WAITING_FUND_NOT_FOUND',
    INSUFFICIENT: 'WAITING_FUND_INSUFFICIENT',
    VERSION_CONFLICT: 'WAITING_FUND_VERSION_CONFLICT',
} as const;
