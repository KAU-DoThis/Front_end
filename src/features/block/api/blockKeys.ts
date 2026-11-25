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
    /** 배분하기 화면(06)이 쓰는 쿼리 묶음. 다 나누면 그 나눌 돈이 없어져서 배분 확정 뒤 다시 받지 않는다. */
    allocation: () => [...blockKeys.all, 'allocation'] as const,
    allocationDraft: (waitingFundId: number) =>
        [...blockKeys.allocation(), 'draft', waitingFundId] as const,
    /** amounts: [blockId, 금액] 목록 (금액이 0보다 큰 것만) */
    simulateAllocation: (waitingFundId: number, amounts: [number, number][]) =>
        [...blockKeys.allocation(), 'simulate', waitingFundId, amounts] as const,
    setupProposal: () => [...blockKeys.all, 'setup', 'proposal'] as const,
    setupPreview: (body: BlockSetupRequest) =>
        [...blockKeys.all, 'setup', 'preview', body] as const,
};
