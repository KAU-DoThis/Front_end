import type { AgentRoom } from '@/features/suggestion/types/agentRoom';

import { USE_MOCK } from '@/lib/mock';

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
 * 서버 모드 바로 시키기 칩. 목업 칩의 '여행' 블록은 시연 계정에 없어서 바꾼다.
 * shortcut: 시연 계정(생활비·멜론 블록) 기준 고정 문구, 방 요약 API가 칩을 주면 그 값으로 바꾼다.
 */
const SERVER_QUICK_COMMANDS = [
    '생활비에서 멜론으로 1만 원 옮겨줘',
    '나눌 돈 나눠줘',
    '이번 달 어땠어?',
];

/**
 * 초불이의 방 데이터 (요약 숫자·기분·선반은 서버 API가 없어 목업)
 * 대화·이동 제안은 coachApi가 서버로 처리한다.
 */
export const getAgentRoom = (): Promise<AgentRoom> =>
    mockResponse(() =>
        USE_MOCK ? AGENT_ROOM_MOCK : { ...AGENT_ROOM_MOCK, quickCommands: SERVER_QUICK_COMMANDS },
    );
