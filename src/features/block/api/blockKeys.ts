export const blockKeys = {
    all: ['blocks'] as const,
    home: () => [...blockKeys.all, 'home'] as const,
    detail: (blockId: number) => [...blockKeys.all, blockId] as const,
    simulate: (fromBlockId: number, toBlockId: number, amount: number) =>
        [...blockKeys.all, 'simulate', fromBlockId, toBlockId, amount] as const,
};
