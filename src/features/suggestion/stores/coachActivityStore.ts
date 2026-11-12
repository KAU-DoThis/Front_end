import { create } from 'zustand';

import type { TransferResultCard } from '@/features/suggestion/types/coach';

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 초불이에게 시켜서 옮긴 일 한 건 */
export interface CoachMove {
    proposalId: number;
    /** 한국 시각 yyyy-MM-ddTHH:mm */
    performedAt: string;
    result: TransferResultCard;
    /** 옮긴 뒤 하루 쓸 돈 변화 (제안 카드 값) */
    dailyBudget: { before: number; after: number } | null;
    /** 되돌렸으면 되돌린 결과 */
    undoResult: TransferResultCard | null;
}

interface CoachActivityState {
    /** 최근 것이 앞 */
    moves: CoachMove[];
    addMove: (move: Omit<CoachMove, 'performedAt' | 'undoResult'>) => void;
    markUndone: (proposalId: number, undoResult: TransferResultCard) => void;
}

/**
 * 이번 실행에서 초불이가 옮긴 일 (8. 초불이가 한 일 · 4-1 홈 배너)
 * shortcut: 기록 조회 API가 없어 앱을 다시 켜면 사라진다. 서버 기록 API가 생기면 그걸로 바꾼다.
 */
export const useCoachActivityStore = create<CoachActivityState>((set) => ({
    moves: [],
    addMove: (move) =>
        set((state) => ({
            moves: [
                {
                    ...move,
                    performedAt: new Date(Date.now() + KST_OFFSET_MS).toISOString().slice(0, 16),
                    undoResult: null,
                },
                ...state.moves,
            ],
        })),
    markUndone: (proposalId, undoResult) =>
        set((state) => ({
            moves: state.moves.map((move) =>
                move.proposalId === proposalId ? { ...move, undoResult } : move,
            ),
        })),
}));
