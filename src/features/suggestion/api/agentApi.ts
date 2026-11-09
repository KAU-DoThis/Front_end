import type { AgentRoom } from '@/features/suggestion/types/agentRoom';

import { AGENT_ROOM_MOCK } from './agentRoomMock';

/** 목업 응답 지연 (로딩 상태 확인용) */
const MOCK_DELAY_MS = 200;

/** 목업 객체를 그대로 넘기지 않고 복사해서 준다. (blockApi와 같은 방식) */
function mockResponse<T>(create: () => T): Promise<T> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                resolve(JSON.parse(JSON.stringify(create())) as T);
            } catch (error) {
                reject(error);
            }
        }, MOCK_DELAY_MS);
    });
}

/**
 * 초불이의 방 데이터
 * 백엔드 API가 정해지면 아래처럼 바꾼다. (화면·훅은 그대로)
 * request<AgentRoom>({ method: 'GET', url: '/agent/room' })
 */
export const getAgentRoom = (): Promise<AgentRoom> => mockResponse(() => AGENT_ROOM_MOCK);
