import type { BlockSetupRequest } from '@/features/block/types/blockSetup';

export const blockKeys = {
    all: ['blocks'] as const,
    home: () => [...blockKeys.all, 'home'] as const,
    /** GET /blocks 목록 (거래 화면의 블록 점 색·필터에 쓴다) */
    list: () => [...blockKeys.all, 'list'] as const,
    detail: (blockId: number) => [...blockKeys.all, blockId] as const,
    simulate: (fromBlockId: number, toBlockId: number, amount: number) =>
        [...blockKeys.all, 'simulate', fromBlockId, toBlockId, amount] as const,
    waitingFunds: () => [...blockKeys.all, 'waiting-funds'] as const,
    allocationDraft: (waitingFundId: number) =>
        [...blockKeys.waitingFunds(), waitingFundId, 'draft'] as const,
    /** amounts: [blockId, 금액] 목록 (금액이 0보다 큰 것만) */
    simulateAllocation: (waitingFundId: number, amounts: [number, number][]) =>
        [...blockKeys.all, 'simulate-allocation', waitingFundId, amounts] as const,
    setupProposal: () => [...blockKeys.all, 'setup', 'proposal'] as const,
    setupPreview: (body: BlockSetupRequest) =>
        [...blockKeys.all, 'setup', 'preview', body] as const,
};
