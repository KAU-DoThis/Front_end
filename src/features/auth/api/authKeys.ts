export const authKeys = {
    all: ['auth'] as const,
    settings: () => [...authKeys.all, 'settings'] as const,
};
