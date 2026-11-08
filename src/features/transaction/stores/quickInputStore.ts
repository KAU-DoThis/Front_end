import { create } from 'zustand';

/**
 * 사용자가 직접 고른 값. 서버가 나눈 값(parsed)이 바뀌면 버린다.
 * 예: 날짜를 12일로 골랐다가 '어제'라고 다시 적으면 적은 대로 어제가 된다.
 */
export interface PickedValue<T> {
    value: T;
    parsed: T;
}

/** 빠른 입력 시트(10)에서 적는 중인 값. 시트를 닫을 때 reset()으로 비운다. */
interface QuickInputState {
    text: string;
    /** 시트 안에서 한 단계 들어가 고르는 중인 값 */
    picking: 'date' | 'block' | null;
    pickedDate: PickedValue<string> | null;
    pickedBlockId: PickedValue<number> | null;
    setText: (text: string) => void;
    setPicking: (picking: 'date' | 'block' | null) => void;
    setPickedDate: (pickedDate: PickedValue<string>) => void;
    setPickedBlockId: (pickedBlockId: PickedValue<number>) => void;
    reset: () => void;
}

const INITIAL_STATE = {
    text: '',
    picking: null,
    pickedDate: null,
    pickedBlockId: null,
};

export const useQuickInputStore = create<QuickInputState>((set) => ({
    ...INITIAL_STATE,

    setText(text) {
        set({ text });
    },

    setPicking(picking) {
        set({ picking });
    },

    setPickedDate(pickedDate) {
        set({ pickedDate, picking: null });
    },

    setPickedBlockId(pickedBlockId) {
        set({ pickedBlockId, picking: null });
    },

    reset() {
        set(INITIAL_STATE);
    },
}));
