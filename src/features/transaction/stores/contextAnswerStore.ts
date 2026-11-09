import { create } from 'zustand';

/** 에이전트 질문 시트(09-1)에서 고르는 중인 답. 시트를 닫을 때 reset()으로 비운다. */
interface ContextAnswerState {
    /**
     * undefined면 아직 고르지 않은 처음 상태: 서버가 짐작한 첫 선택지를 골라 둔 것으로 본다.
     * null이면 직접 적느라 선택지를 푼 상태다.
     */
    selectedCode: string | null | undefined;
    freeText: string;
    saveRule: boolean;
    /** 선택지를 고르면 직접 적은 내용을 지운다. */
    select: (code: string) => void;
    /** 직접 적으면 고른 선택지를 푼다. */
    changeFreeText: (text: string) => void;
    toggleSaveRule: () => void;
    reset: () => void;
}

const INITIAL_STATE = {
    selectedCode: undefined,
    freeText: '',
    saveRule: true,
};

export const useContextAnswerStore = create<ContextAnswerState>((set) => ({
    ...INITIAL_STATE,

    select(code) {
        set({ selectedCode: code, freeText: '' });
    },

    changeFreeText(text) {
        set((state) => ({
            freeText: text,
            selectedCode: text.trim() === '' ? state.selectedCode : null,
        }));
    },

    toggleSaveRule() {
        set((state) => ({ saveRule: !state.saveRule }));
    },

    reset() {
        set(INITIAL_STATE);
    },
}));
