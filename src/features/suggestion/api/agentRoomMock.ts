import type { AgentRoom } from '@/features/suggestion/types/agentRoom';

/**
 * 초불이의 방 목업 (시안 '초불이의 방' 1·1-1 값)
 * 블록 값은 홈 목업(blockHomeMock)과 같게 맞췄다.
 */
export const AGENT_ROOM_MOCK: AgentRoom = {
    blockCount: 5,
    attentionBlockCount: 2,
    todayAvailable: 52_700,
    goal: { blockId: 3, name: '여행', achievementRate: 40 },
    confirmedSaving: 87_000,
    uncheckedTransactionCount: 2,
    quickCommands: ['여행에서 5만 원 생활비로 옮겨줘', '나눌 돈 나눠줘', '이번 달 어땠어?'],
    lastAction: {
        // 시안처럼 항상 '어제'로 보이게 오늘 기준으로 만든다.
        performedAt: new Date(Date.now() - 86_400_000).toISOString(),
        message: '지난 입금 중 100,000원을 저축에 넣었어요',
        blockColor: 'j',
        blockFillRate: 67,
    },
    shelfBlocks: [
        {
            blockId: 1,
            name: '생활비',
            color: 'i',
            status: 'CAUTION',
            fillRate: 63,
            balance: 950_000,
            badge: null,
        },
        {
            blockId: 2,
            name: '저축',
            color: 'j',
            status: 'SAFE',
            fillRate: 67,
            balance: 2_000_000,
            badge: null,
        },
        {
            blockId: 3,
            name: '여행',
            color: 'o',
            status: 'CAUTION',
            fillRate: 40,
            balance: 320_000,
            badge: null,
        },
        {
            blockId: 4,
            name: '월세',
            color: 'l',
            status: 'SAFE',
            fillRate: 100,
            balance: 600_000,
            badge: 'D-11',
        },
        {
            blockId: 5,
            name: '저금통',
            color: 't',
            status: 'SAFE',
            fillRate: 100,
            balance: 500_000,
            badge: '목표 달성',
        },
    ],
};
