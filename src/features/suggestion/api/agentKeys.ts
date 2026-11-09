export const agentKeys = {
    all: ['agent'] as const,
    room: () => [...agentKeys.all, 'room'] as const,
};
