import type { BlockDetail } from '@/features/block/types/blockDetail';
import type { BlockDetailResponse } from '@/features/block/types/blockDetailResponse';
import type { BlockHome } from '@/features/block/types/blockHome';
import type { HomeResponse } from '@/features/block/types/homeResponse';
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
import { USE_MOCK } from '@/lib/mock';

import { toBlockDetail } from './blockDetailMapper';
import { BLOCK_DETAIL_MOCK } from './blockDetailMock';
import { BLOCK_HOME_MOCK } from './blockHomeMock';
import { toBlockHome } from './blockHomeMapper';
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
 * 홈 화면 데이터. 서버 응답을 화면용 BlockHome으로 바꿔서 준다.
 * 목업 모드(USE_MOCK)에서는 목업을 준다. 서버 홈의 블록 ID는 상세·자금 이동 목업에 없어서,
 * 그 화면을 확인하거나 시연할 때는 목업 모드로 본다.
 * TODO: 블록 상세(v4)·자금 이동(#17) API가 붙으면 목업과 함께 지운다.
 */
export const getBlockHome = async (): Promise<BlockHome> => {
    if (USE_MOCK) {
        return mockResponse(() => BLOCK_HOME_MOCK);
    }
    const response = await request<HomeResponse>({ method: 'GET', url: '/home' });
    return toBlockHome(response);
};

/**
 * 블록 상세. 서버 응답을 화면용 BlockDetail로 바꿔서 준다.
 * 목업 모드에서 목업에 없는 블록은 null — 상세 화면이 준비 중으로 보여준다.
 */
export const getBlockDetail = async (blockId: number): Promise<BlockDetail | null> => {
    if (USE_MOCK) {
        return mockResponse(() => BLOCK_DETAIL_MOCK[blockId] ?? null);
    }
    const response = await request<BlockDetailResponse>({
        method: 'GET',
        url: `/blocks/${blockId}`,
    });
    return toBlockDetail(response);
};

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
 * 온보딩 블록 구성 API가 아직 없어서 목업 모드(USE_MOCK)에서는 목업으로 처리한다.
 * TODO: API가 붙으면 목업과 함께 제거한다. (URL은 지금은 가정값)
 */
const USE_BLOCK_SETUP_MOCK = USE_MOCK;

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
