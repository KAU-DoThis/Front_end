import type { BlockDetail } from '@/features/block/types/blockDetail';
import type { BlockHome } from '@/features/block/types/blockHome';
import type {
    SimulateRequest,
    SimulateResponse,
    TransferRequest,
    TransferResponse,
} from '@/features/block/types/blockTransfer';

import { BLOCK_DETAIL_MOCK } from './blockDetailMock';
import { BLOCK_HOME_MOCK } from './blockHomeMock';
import { simulateTransferMock, transferBlockMock } from './blockTransferMock';

/** 목업 응답 지연 (로딩 상태 확인용) */
const MOCK_DELAY_MS = 200;

/**
 * 목업은 자금 이동 확정 때 값이 바뀐다. 같은 객체를 그대로 돌려주면
 * TanStack Query가 바뀐 걸 알아채지 못하므로 매번 복사해서 준다.
 */
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
 * 홈 화면 데이터
 * 백엔드 홈 API가 정해지면 아래처럼 바꾼다. (화면·훅은 그대로)
 * request<BlockHome>({ method: 'GET', url: '/home' })
 */
export const getBlockHome = (): Promise<BlockHome> => mockResponse(() => BLOCK_HOME_MOCK);

/**
 * 블록 상세 (목업에 없는 블록은 null — 상세 화면이 준비 중으로 보여준다)
 * 백엔드 상세 API가 정해지면 request<BlockDetail>({ method: 'GET', url: `/blocks/${blockId}` })
 */
export const getBlockDetail = (blockId: number): Promise<BlockDetail | null> =>
    mockResponse(() => BLOCK_DETAIL_MOCK[blockId] ?? null);

/**
 * 이동·배분 미리보기 (03-2 이동 전 검증)
 * 백엔드가 나오면 request<SimulateResponse>({ method: 'POST', url: '/blocks/simulate', data: body })
 */
export const simulateTransfer = (body: SimulateRequest): Promise<SimulateResponse> =>
    mockResponse(() => simulateTransferMock(body));

/**
 * 블록 간 이동 확정 (03-2 옮기기)
 * 백엔드가 나오면 request<TransferResponse>({ method: 'POST', url: '/blocks/transfers', data: body })
 */
export const transferBlock = (body: TransferRequest): Promise<TransferResponse> =>
    mockResponse(() => transferBlockMock(body));
