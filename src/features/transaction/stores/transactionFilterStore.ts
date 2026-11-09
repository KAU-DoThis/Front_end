import { create } from 'zustand';

import type {
    TransactionListParams,
    TransactionStatusFilter,
    TransactionTab,
} from '@/features/transaction/types/transaction';

/**
 * 내역 탭에서 고른 탭과 거래 목록 조건.
 * 거래 목록과 소비 분석이 같은 달을 보도록 한곳에 둔다. 내역 화면이 사라질 때 reset()으로 비운다.
 */
interface TransactionFilterState {
    tab: TransactionTab;
    params: TransactionListParams;
    setTab: (tab: TransactionTab) => void;
    setMonth: (month: string) => void;
    setStatus: (status: TransactionStatusFilter) => void;
    setBlockId: (blockId: number | null) => void;
    setAccountId: (accountId: number | null) => void;
    /** 다른 화면에서 블록·계좌를 들고 들어왔을 때: 거래 목록 탭에서 그 조건만 건다. (달은 그대로) */
    applyRouteFilter: (filter: { blockId: number | null; accountId: number | null }) => void;
    reset: () => void;
}

const INITIAL_STATE = {
    tab: 'LIST' as TransactionTab,
    params: { month: null, status: 'ALL', blockId: null, accountId: null } as TransactionListParams,
};

export const useTransactionFilterStore = create<TransactionFilterState>((set) => ({
    ...INITIAL_STATE,

    setTab(tab) {
        set({ tab });
    },

    setMonth(month) {
        set((state) => ({ params: { ...state.params, month } }));
    },

    setStatus(status) {
        set((state) => ({ params: { ...state.params, status } }));
    },

    setBlockId(blockId) {
        set((state) => ({ params: { ...state.params, blockId } }));
    },

    setAccountId(accountId) {
        set((state) => ({ params: { ...state.params, accountId } }));
    },

    applyRouteFilter({ blockId, accountId }) {
        set((state) => ({
            tab: 'LIST',
            params: { ...state.params, status: 'ALL', blockId, accountId },
        }));
    },

    reset() {
        set(INITIAL_STATE);
    },
}));
