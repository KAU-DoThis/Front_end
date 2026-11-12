import { request } from '@/lib/apiClient';
import { USE_MOCK } from '@/lib/mock';

import type {
    CoachMessageRequest,
    CoachMessageResponse,
    CoachRoomResponse,
    ProposalActionResponse,
} from '@/features/suggestion/types/coach';

import {
    COACH_MESSAGE_MOCK,
    COACH_ROOM_MOCK,
    coachAcceptMock,
    coachTextMock,
    coachUndoMock,
} from './coachMock';

/** 백엔드가 AI 답을 최대 40초 기다린다. 앱 기본 타임아웃(10초)보다 길게 잡는다. */
const COACH_MESSAGE_TIMEOUT_MS = 45_000;
const MOCK_DELAY_MS = 800;

const mockResponse = <T>(value: T, signal?: AbortSignal) =>
    new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => resolve(value), MOCK_DELAY_MS);
        signal?.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(signal.reason);
        });
    });

/** 방에 들어올 때 대화 세션을 받는다. */
export const getCoachRoom = (): Promise<CoachRoomResponse> =>
    USE_MOCK
        ? mockResponse(COACH_ROOM_MOCK)
        : request<CoachRoomResponse>({ method: 'GET', url: '/coach/room' });

/** 초불이에게 말을 보낸다. 이동을 시키면 이동 제안 카드가 같이 온다. signal로 [그만두기]한다. */
export const sendCoachMessage = (
    body: CoachMessageRequest,
    signal?: AbortSignal,
): Promise<CoachMessageResponse> => {
    if (USE_MOCK) {
        // 목업: "옮겨"가 들어가면 제안 카드, 아니면 문장만
        return mockResponse(
            body.text.includes('옮겨') ? COACH_MESSAGE_MOCK : coachTextMock,
            signal,
        );
    }
    return request<CoachMessageResponse>({
        method: 'POST',
        url: '/coach/room/messages',
        data: body,
        timeout: COACH_MESSAGE_TIMEOUT_MS,
        signal,
    });
};

/** 제안 수락 (옮기기). requiresConfirm 카드는 confirmed: true로 보낸다. */
export const acceptProposal = ({
    proposalId,
    confirmed,
}: {
    proposalId: number;
    confirmed: boolean;
}): Promise<ProposalActionResponse> =>
    USE_MOCK
        ? mockResponse(coachAcceptMock(proposalId))
        : request<ProposalActionResponse>({
              method: 'POST',
              url: `/coach/proposals/${proposalId}/accept`,
              data: { confirmed },
          });

/** 옮긴 것 되돌리기 (한 번만, 전액만) */
export const undoProposal = (proposalId: number): Promise<ProposalActionResponse> =>
    USE_MOCK
        ? mockResponse(coachUndoMock(proposalId))
        : request<ProposalActionResponse>({
              method: 'POST',
              url: `/coach/proposals/${proposalId}/undo`,
          });
