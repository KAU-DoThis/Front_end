import type { BlockType } from '@/features/block/types/block';

/**
 * 초불이의 방 대화·이동 제안 (Back_end coach API 응답 그대로)
 * GET /coach/room · POST /coach/room/messages · POST /coach/proposals/{id}/accept|undo
 */

export interface CoachRoomResponse {
    sessionId: string;
    greeting: string;
}

export interface CoachMessageRequest {
    sessionId: string;
    text: string;
}

export interface CoachMessageResponse {
    /** 초불이 말풍선 문장 */
    text: string;
    /** 이동을 시켰으면 이동 제안 카드, 아니면 null */
    card: TransferProposalCard | null;
    /** AI 서버가 답하지 못해 고정 문장으로 답했으면 false */
    aiAvailable: boolean;
}

/** PENDING이 아니면 수락·거절 버튼을 숨긴다. */
export type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'UNDONE';

export interface ProposalSide {
    blockId: number;
    name: string;
    type: BlockType;
    balanceBefore: number;
    balanceAfter: number;
    version: number | null;
}

/** 이동 제안 카드 (아직 옮기지 않음, 10분 뒤 만료) */
export interface TransferProposalCard {
    type: 'TRANSFER_PROPOSAL';
    proposalId: number;
    status: ProposalStatus;
    amount: number;
    from: ProposalSide;
    to: ProposalSide;
    /** 목표형 예상 달성일 변화 */
    goalDelay: {
        blockId: number;
        name: string;
        before: string;
        after: string;
        delayDays: number;
    } | null;
    /** 기본 사용형 블록 기준 하루 쓸 돈 변화 */
    dailyBudget: { before: number; after: number; diff: number } | null;
    fixedImpact: {
        affected: boolean;
        items: {
            blockId: number;
            name: string;
            payDate: string;
            payAmount: number;
            shortage: number;
        }[];
    } | null;
    /** 고정지출이 모자라게 되는 등, 수락 전에 한 번 더 확인 */
    requiresConfirm: boolean;
    /** 잔액보다 큰 금액 등으로 수락할 수 없음 */
    blocked: boolean;
    blockedReason: string | null;
    expiresAt: string;
}

export interface TransferResultSide {
    blockId: number;
    name: string;
    balanceAfter: number;
    /** 바뀐 금액 (나간 블록은 음수) */
    diff: number;
}

/** 이동 결과 카드. 되돌린 결과면 undo=true이고 from·to가 반대로 온다. */
export interface TransferResultCard {
    type: 'TRANSFER_RESULT';
    proposalId: number;
    transferId: number;
    amount: number;
    from: TransferResultSide;
    to: TransferResultSide;
    undo: boolean;
    /** [되돌리기] 버튼을 보여 줄지 */
    undoable: boolean;
    actions: ('UNDO' | 'OPEN_HOME')[];
}

/** 수락·되돌리기 응답 */
export interface ProposalActionResponse {
    proposalId: number;
    status: ProposalStatus;
    /** 초불이 말풍선 문장 */
    text: string;
    card: TransferResultCard | null;
}

/** 화면 분기용 에러 코드 */
export const COACH_ERROR_CODE = {
    PROPOSAL_STALE: 'COACH_PROPOSAL_STALE',
    PROPOSAL_EXPIRED: 'COACH_PROPOSAL_EXPIRED',
    UNDO_INSUFFICIENT_BALANCE: 'COACH_UNDO_INSUFFICIENT_BALANCE',
} as const;
