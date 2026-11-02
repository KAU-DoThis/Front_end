import type { BlockHome } from '@/features/block/types/blockHome';

import { BLOCK_HOME_MOCK } from './blockHomeMock';

/**
 * 홈 화면 데이터
 * 백엔드 홈 API가 정해지면 아래처럼 바꾼다. (화면·훅은 그대로)
 * request<BlockHome>({ method: 'GET', url: '/blocks/home' })
 */
export const getBlockHome = (): Promise<BlockHome> => Promise.resolve(BLOCK_HOME_MOCK);
