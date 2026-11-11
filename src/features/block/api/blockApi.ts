import type { BlockDetail } from '@/features/block/types/blockDetail';
import type { BlockDetailResponse } from '@/features/block/types/blockDetailResponse';
import type {
    BlockProposalConfirmResponse,
    BlockProposalResponse,
} from '@/features/block/types/blockProposalResponse';
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
import type {
    AllocationRequest,
    AllocationResponse,
    WaitingFundListResponse,
} from '@/features/block/types/waitingFund';
import { request } from '@/lib/apiClient';
import { USE_MOCK } from '@/lib/mock';
import { queryClient } from '@/lib/queryClient';

import { toBlockDetail } from './blockDetailMapper';
import { BLOCK_DETAIL_MOCK } from './blockDetailMock';
import { BLOCK_HOME_MOCK } from './blockHomeMock';
import { toBlockHome } from './blockHomeMapper';
import { blockKeys } from './blockKeys';
import { toBlockSetupProposal, toConfirmItems, toInterimPreview } from './blockSetupMapper';
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
 * 목업 모드(USE_MOCK)에서는 목업을 준다. 상세·자금 이동도 같은 모드를 따라서 블록 ID가 서로 맞는다.
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

/** 이동·배분 미리보기 (03-2 이동 전 검증, 06 나눌 돈 배분). 저장하지 않는다. */
export const simulateTransfer = (body: SimulateRequest): Promise<SimulateResponse> => {
    if (USE_MOCK) {
        return mockResponse(() => simulateTransferMock(body));
    }
    return request<SimulateResponse>({ method: 'POST', url: '/blocks/simulate', data: body });
};

/**
 * 블록 이름 바꾸기 (PATCH /blocks/{blockId}). 보낸 필드만 바뀐다.
 * 목업 모드에서는 홈·상세 목업의 이름을 바꾼다.
 */
export const renameBlock = ({ blockId, name }: { blockId: number; name: string }) => {
    if (USE_MOCK) {
        return mockResponse(() => {
            const homeBlock = BLOCK_HOME_MOCK.blocks.find((block) => block.blockId === blockId);
            if (homeBlock) homeBlock.name = name;
            const detail = BLOCK_DETAIL_MOCK[blockId];
            if (detail) detail.block.name = name;
            return null;
        });
    }
    return request<unknown>({ method: 'PATCH', url: `/blocks/${blockId}`, data: { name } });
};

/** 블록 간 이동 확정 (03-2 옮기기) */
export const transferBlock = (body: TransferRequest): Promise<TransferResponse> => {
    if (USE_MOCK) {
        return mockResponse(() => transferBlockMock(body));
    }
    return request<TransferResponse>({ method: 'POST', url: '/blocks/transfers', data: body });
};

/** 나눌 돈 목록 (남은 금액이 있는 것만) */
export const getWaitingFunds = (): Promise<WaitingFundListResponse> => {
    if (USE_MOCK) {
        return mockResponse(() => {
            const waitingFunds = BLOCK_HOME_MOCK.pendingMoney;
            const total = waitingFunds.reduce((sum, fund) => sum + fund.amount, 0);
            return { waitingFunds, total };
        });
    }
    return request<WaitingFundListResponse>({ method: 'GET', url: '/waiting-funds' });
};

/**
 * 나눌 돈 배분 확정 (06)
 * TODO: 배분 화면(06)을 붙일 때 목업 모드용 목업도 같이 만든다. 지금은 부르는 화면이 없다.
 */
export const allocateWaitingFund = (
    waitingFundId: number,
    body: AllocationRequest,
): Promise<AllocationResponse> =>
    request<AllocationResponse>({
        method: 'POST',
        url: `/waiting-funds/${waitingFundId}/allocations`,
        data: body,
    });

/** 온보딩 블록 구성은 목업 모드(USE_MOCK)에서 목업으로 처리한다. */
const USE_BLOCK_SETUP_MOCK = USE_MOCK;

/** 로딩 상태도 확인할 수 있게 약간 지연한다. */
const delay = <T>(value: () => T, ms: number) =>
    new Promise<T>((resolve) => setTimeout(() => resolve(value()), ms));

/** 연동한 3개월 거래로 나눈 블록 구성안 */
export const getBlockSetupProposal = async (): Promise<BlockSetupProposal> => {
    if (USE_BLOCK_SETUP_MOCK) {
        return delay(() => BLOCK_SETUP_PROPOSAL_MOCK, 800);
    }
    const response = await request<BlockProposalResponse>({
        method: 'GET',
        url: '/blocks/proposals',
    });
    return toBlockSetupProposal(response);
};

/**
 * 고친 블록으로 합계·하루 쓸 돈·경고를 계산한다. (저장하지 않는다)
 * TODO: 서버 미리보기 API(POST /blocks/proposals/preview)가 생기면 그 응답을 쓴다.
 *       지금은 연동 잔액만 서버(GET /linked-accounts)에서 받고 나머지는 임시로 계산한다.
 *       잔액을 받지 못하면 구성안을 받을 때의 잔액을 쓴다. (잔액 조회 실패로 확정이 막히지 않도록)
 */
export const previewBlockSetup = async (body: BlockSetupRequest): Promise<BlockSetupPreview> => {
    if (USE_BLOCK_SETUP_MOCK) {
        return delay(() => mockBlockSetupPreview(body), 200);
    }
    const linkedBalance = await request<{ totalBalance: number }>({
        method: 'GET',
        url: '/linked-accounts',
    })
        .then(({ totalBalance }) => totalBalance)
        .catch((error: unknown) => {
            const proposal = queryClient.getQueryData<BlockSetupProposal>(
                blockKeys.setupProposal(),
            );
            if (!proposal) throw error;
            return proposal.linkedBalance;
        });
    return toInterimPreview(body, linkedBalance);
};

/** 블록 구성을 확정해 블록을 만든다. 남는 돈은 서버가 나눌 돈으로 만든다. */
export const createSetupBlocks = async (body: BlockSetupRequest): Promise<null> => {
    if (USE_BLOCK_SETUP_MOCK) {
        return delay<null>(() => null, 800);
    }
    await request<BlockProposalConfirmResponse>({
        method: 'POST',
        url: '/blocks/proposals/confirm',
        data: { blocks: toConfirmItems(body) },
    });
    return null;
};
