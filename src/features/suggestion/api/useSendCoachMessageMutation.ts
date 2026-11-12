import { useMutation } from '@tanstack/react-query';

import type { CoachMessageRequest } from '@/features/suggestion/types/coach';

import { sendCoachMessage } from './coachApi';

/** 초불이에게 말 보내기. signal로 기다리는 중에 그만둔다. */
export function useSendCoachMessageMutation() {
    return useMutation({
        mutationFn: ({ body, signal }: { body: CoachMessageRequest; signal: AbortSignal }) =>
            sendCoachMessage(body, signal),
    });
}
