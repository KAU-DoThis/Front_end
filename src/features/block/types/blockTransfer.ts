import type { Status } from '@/shared/components/ui/StatusTag';
import type { ImpactItem } from '@/shared/components/ui/ImpactList';

/**
 * 블록 간 이동 (API 명세 v4 6장 — POST /blocks/simulate, POST /blocks/transfers)
 * 백엔드 컨트롤러가 아직 없어 명세 응답 예시대로 목업을 쓴다. (blockTransferMock.ts)
 */

/** 미리보기 요청 한 건. 블록 간 이동은 from·to 블록, 대기 자금 배분은 fromWaitingFundId를 쓴다. */
export type SimulateChange =
    | { fromBlockId: number; toBlockId: number; amount: number }
    | { fromWaitingFundId: number; toBlockId: number; amount: number };

export interface SimulateRequest {
    changes: SimulateChange[];
}

/** 미리보기 결과의 블록 잔액 전후 */
export interface SimulateBlockResult {
    blockId: number;
    name: string;
    balanceBefore: number;
    balanceAfter: number;
    /**
     * 옮긴 뒤 물 높이 0~100 (03-2 작은 비커)
     * 명세 v4엔 없어서 백엔드에 추가를 요청한 값 — 목업은 서버 대신 계산해 준다.
     */
    fillRateAfter?: number;
    /** 확정 요청에 그대로 보낸다. (동시 수정 방지) */
    version: number;
}

/** 결과 한 줄 = ImpactList 한 줄 + 전후 값 */
export interface TransferImpactItem extends ImpactItem {
    blockId: number;
    /** 날짜(yyyy-MM-dd)나 상태 코드 등 바뀌기 전 값 */
    before?: string;
    after?: string;
}

export interface SimulateResponse {
    blocks: SimulateBlockResult[];
    /** 서버가 danger → warn → good → info 순으로 정렬해서 보낸다. */
    items: TransferImpactItem[];
    /** 3줄을 넘어 접힌 항목 수 */
    hiddenCount: number;
    /** 받는 블록이 모자란 금액 — 시트의 [부족한 만큼] 버튼 값 */
    shortfall: { blockId: number; amount: number } | null;
    /** 대기 자금 배분일 때 남는 돈 (블록 간 이동이면 null) */
    remainingWaiting: number | null;
    /** danger 항목이 있어 한 번 더 확인해야 함 (고정지출 납부 부족 등) */
    requiresConfirm: boolean;
    /** 확정할 수 없음 (보내는 블록 잔액보다 큰 금액 등) */
    blocked: boolean;
    blockedReason: string | null;
}

export type TransferReason = 'MANUAL' | 'SUGGESTION' | 'AI';

export interface TransferRequest {
    fromBlockId: number;
    toBlockId: number;
    amount: number;
    reason: TransferReason;
    fromVersion: number;
    toVersion: number;
    /** requiresConfirm이었던 이동을 사용자가 다시 확인했는지 */
    confirmed: boolean;
    /** 다음 정기 입금 때 보낸 블록으로 되돌리기 (03-2 토글) */
    autoReturn: { enabled: boolean; on: 'NEXT_REGULAR_INCOME' };
}

export interface TransferResultBlock {
    blockId: number;
    balance: number;
    status: Status;
    version: number;
}

export interface TransferResponse {
    transferId: number;
    fromBlock: TransferResultBlock;
    toBlock: TransferResultBlock;
    /** 기본 사용형 블록이 바뀌었을 때만 */
    dailyGuide: { todayAvailable: number; todayRemaining: number } | null;
    /** 자동 되돌리기를 켰을 때만 */
    scheduledReturn: { scheduledTransferId: number; expectedDate: string; amount: number } | null;
}

/** 확정 에러 코드 (명세 v4 6장) — 화면 분기는 ApiError.code로 한다. */
export const TRANSFER_ERROR_CODE = {
    INSUFFICIENT_BALANCE: 'TRANSFER_INSUFFICIENT_BALANCE',
    SAME_BLOCK: 'TRANSFER_SAME_BLOCK',
    CONFIRM_REQUIRED: 'TRANSFER_CONFIRM_REQUIRED',
    VERSION_CONFLICT: 'BLOCK_VERSION_CONFLICT',
} as const;
