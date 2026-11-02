import type { BlockDetail } from '@/features/block/types/blockDetail';
import type { BlockHome } from '@/features/block/types/blockHome';

import { BLOCK_DETAIL_MOCK } from './blockDetailMock';
import { BLOCK_HOME_MOCK } from './blockHomeMock';

/**
 * 홈 화면 데이터
 * 백엔드 홈 API가 정해지면 아래처럼 바꾼다. (화면·훅은 그대로)
 * request<BlockHome>({ method: 'GET', url: '/blocks/home' })
 */
export const getBlockHome = (): Promise<BlockHome> => Promise.resolve(BLOCK_HOME_MOCK);

/**
 * 블록 상세 (목업에 없는 블록은 null — 상세 화면이 준비 중으로 보여준다)
 * 백엔드 상세 API가 정해지면 request<BlockDetail>({ method: 'GET', url: `/blocks/${blockId}/detail` })
 */
export const getBlockDetail = (blockId: number): Promise<BlockDetail | null> =>
    Promise.resolve(BLOCK_DETAIL_MOCK[blockId] ?? null);
