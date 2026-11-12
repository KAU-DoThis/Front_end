import type {
    CoachMessageResponse,
    CoachRoomResponse,
    ProposalActionResponse,
    TransferProposalCard,
} from '@/features/suggestion/types/coach';

/** 목업 모드 전용 (시안 '초불이의 방' 2·4·8-2 값: 여행 → 생활비 50,000원) */

export const COACH_ROOM_MOCK: CoachRoomResponse = {
    sessionId: 'mock-session',
    greeting: '어서 오세요. 블록 옮기기든 궁금한 거든 말해 주세요.',
};

const PROPOSAL_MOCK: TransferProposalCard = {
    type: 'TRANSFER_PROPOSAL',
    proposalId: 1,
    status: 'PENDING',
    amount: 50_000,
    from: {
        blockId: 3,
        name: '여행',
        type: 'GOAL',
        balanceBefore: 320_000,
        balanceAfter: 270_000,
        version: 1,
    },
    to: {
        blockId: 1,
        name: '생활비',
        type: 'SPENDING',
        balanceBefore: 950_000,
        balanceAfter: 1_000_000,
        version: 1,
    },
    goalDelay: {
        blockId: 3,
        name: '여행',
        before: '2027-03-02',
        after: '2027-03-16',
        delayDays: 14,
    },
    dailyBudget: { before: 52_700, after: 55_500, diff: 2_800 },
    fixedImpact: { affected: false, items: [] },
    requiresConfirm: false,
    blocked: false,
    blockedReason: null,
    expiresAt: '2099-01-01T00:00:00',
};

export const COACH_MESSAGE_MOCK: CoachMessageResponse = {
    text: '맞는지 봐 주세요.',
    card: PROPOSAL_MOCK,
    aiAvailable: true,
};

export const coachTextMock: CoachMessageResponse = {
    text: '목업 모드에서는 "옮겨줘"가 들어간 말에만 카드를 보여줘요.',
    card: null,
    aiAvailable: true,
};

export const coachAcceptMock = (proposalId: number): ProposalActionResponse => ({
    proposalId,
    status: 'ACCEPTED',
    text: '다 옮겼어요!',
    card: {
        type: 'TRANSFER_RESULT',
        proposalId,
        transferId: 1,
        amount: 50_000,
        from: { blockId: 3, name: '여행', balanceAfter: 270_000, diff: -50_000 },
        to: { blockId: 1, name: '생활비', balanceAfter: 1_000_000, diff: 50_000 },
        undo: false,
        undoable: true,
        actions: ['UNDO', 'OPEN_HOME'],
    },
});

export const coachUndoMock = (proposalId: number): ProposalActionResponse => ({
    proposalId,
    status: 'UNDONE',
    text: '되돌렸어요.',
    card: {
        type: 'TRANSFER_RESULT',
        proposalId,
        transferId: 2,
        amount: 50_000,
        from: { blockId: 1, name: '생활비', balanceAfter: 950_000, diff: -50_000 },
        to: { blockId: 3, name: '여행', balanceAfter: 320_000, diff: 50_000 },
        undo: true,
        undoable: false,
        actions: ['OPEN_HOME'],
    },
});
