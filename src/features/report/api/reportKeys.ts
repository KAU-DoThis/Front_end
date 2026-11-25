export const reportKeys = {
    all: ['reports'] as const,
    monthly: (month: string | null) => [...reportKeys.all, 'monthly', month] as const,
};
