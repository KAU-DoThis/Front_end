import type { BlockSetupRequest } from '@/features/block/types/blockSetup';

export const blockKeys = {
    all: ['blocks'] as const,
    home: () => [...blockKeys.all, 'home'] as const,
    detail: (blockId: number) => [...blockKeys.all, blockId] as const,
    simulate: (fromBlockId: number, toBlockId: number, amount: number) =>
        [...blockKeys.all, 'simulate', fromBlockId, toBlockId, amount] as const,
    setupProposal: () => [...blockKeys.all, 'setup', 'proposal'] as const,
    setupPreview: (body: BlockSetupRequest) =>
        [...blockKeys.all, 'setup', 'preview', body] as const,
};
