export const savingKeys = {
    all: ['savings'] as const,
    overview: () => [...savingKeys.all, 'overview'] as const,
    suggestions: () => [...savingKeys.all, 'suggestions'] as const,
};
