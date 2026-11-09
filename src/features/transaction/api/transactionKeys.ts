import type { TransactionListParams } from '@/features/transaction/types/transaction';

export const transactionKeys = {
    all: ['transactions'] as const,
    list: (params: TransactionListParams) => [...transactionKeys.all, 'list', params] as const,
    analysis: (month: string | null) => [...transactionKeys.all, 'analysis', month] as const,
    quickInputPreview: (text: string) => [...transactionKeys.all, 'quick-input', text] as const,
};
