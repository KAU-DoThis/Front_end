import type { BlockDetail } from '@/features/block/types/blockDetail';
import type { BlockHome } from '@/features/block/types/blockHome';
import type {
    BlockSetupPreview,
    BlockSetupProposal,
    BlockSetupRequest,
} from '@/features/block/types/blockSetup';
import type {
    SimulateRequest,
    SimulateResponse,
    TransferRequest,
    TransferResponse,
} from '@/features/block/types/blockTransfer';
import { request } from '@/lib/apiClient';

import { BLOCK_DETAIL_MOCK } from './blockDetailMock';
import { BLOCK_HOME_MOCK } from './blockHomeMock';
import { BLOCK_SETUP_PROPOSAL_MOCK, mockBlockSetupPreview } from './blockSetupMock';
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

/**
 * 온보딩 블록 구성 API가 아직 없어서 개발 빌드에서는 목업으로 처리한다.
 * TODO: API가 붙으면 목업과 함께 제거한다. (URL은 지금은 가정값)
 */
const USE_BLOCK_SETUP_MOCK = __DEV__;

/** 로딩 상태도 확인할 수 있게 약간 지연한다. */
const delay = <T>(value: () => T, ms: number) =>
    new Promise<T>((resolve) => setTimeout(() => resolve(value()), ms));

/** 연동한 3개월 거래로 나눈 AI 블록 제안 */
export const getBlockSetupProposal = () => {
    if (USE_BLOCK_SETUP_MOCK) {
        return delay(() => BLOCK_SETUP_PROPOSAL_MOCK, 800);
    }
    return request<BlockSetupProposal>({ method: 'GET', url: '/onboarding/block-proposal' });
};

/** 고친 블록으로 합계·하루 쓸 돈·경고를 계산한다. (저장하지 않는다) */
export const previewBlockSetup = (body: BlockSetupRequest) => {
    if (USE_BLOCK_SETUP_MOCK) {
        return delay(() => mockBlockSetupPreview(body), 200);
    }
    return request<BlockSetupPreview>({
        method: 'POST',
        url: '/onboarding/block-preview',
        data: body,
    });
};

/** 블록 구성을 확정해 블록을 만든다. 성공하면 온보딩이 끝난다. */
export const createSetupBlocks = (body: BlockSetupRequest) => {
    if (USE_BLOCK_SETUP_MOCK) {
        return delay<null>(() => null, 800);
    }
    return request<null>({ method: 'POST', url: '/onboarding/blocks', data: body });
};
