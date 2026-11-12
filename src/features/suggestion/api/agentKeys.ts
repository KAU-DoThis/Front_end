export const agentKeys = {
    all: ['agent'] as const,
    room: () => [...agentKeys.all, 'room'] as const,
    coachRoom: () => [...agentKeys.all, 'coach-room'] as const,
};
