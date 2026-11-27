import type { Block } from '@/features/block/types/block';
import type { BlockCreateRequest } from '@/features/block/types/blockCreate';
import type { BlockDetail } from '@/features/block/types/blockDetail';
import type { BlockDetailResponse } from '@/features/block/types/blockDetailResponse';
import type {
    BlockProposalConfirmResponse,
    BlockProposalPreviewResponse,
    BlockProposalResponse,
} from '@/features/block/types/blockProposalResponse';
import type { BlockHome } from '@/features/block/types/blockHome';
import type { GoalGuard, ApplyGoalGuardRequest } from '@/features/block/types/goalGuard';
import type { HomeResponse } from '@/features/block/types/homeResponse';
import type {
    BlockSetupPreview,
    BlockSetupProposal,
    BlockSetupRequest,
} from '@/features/block/types/blockSetup';
import type { BlockDeleteResponse, BlockPatch } from '@/features/block/types/blockUpdate';
import type {
    SimulateRequest,
    SimulateResponse,
    TransferRequest,
    TransferResponse,
} from '@/features/block/types/blockTransfer';
import type {
    AllocationDraft,
    AllocationDraftResponse,
    AllocationRequest,
    AllocationResponse,
    WaitingFundListResponse,
} from '@/features/block/types/waitingFund';
import { request } from '@/lib/apiClient';
import { USE_MOCK } from '@/lib/mock';

import {
    allocateWaitingFundMock,
    getAllocationDraftMock,
    simulateAllocationMock,
} from './blockAllocationMock';
import { toBlockDetail } from './blockDetailMapper';
import { BLOCK_DETAIL_MOCK } from './blockDetailMock';
import { BLOCK_HOME_MOCK } from './blockHomeMock';
import { toBlockHome } from './blockHomeMapper';
import { createBlockMock, deleteBlockMock, updateBlockMock } from './blockManageMock';
import {
    toBlockSetupPreview,
    toBlockSetupProposal,
    toConfirmItems,
    toPreviewItems,
} from './blockSetupMapper';
import { BLOCK_SETUP_PROPOSAL_MOCK, mockBlockSetupPreview } from './blockSetupMock';
import { simulateTransferMock, transferBlockMock } from './blockTransferMock';
import { applyGoalGuardMock, getGoalGuardMock } from './goalGuardMock';
import { toBlockUpdateRequest } from './blockUpdateMapper';
import { toAllocationDraft } from './waitingFundMapper';

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
        const isAllocation = body.changes.some((change) => 'fromWaitingFundId' in change);
        return mockResponse(() =>
            isAllocation ? simulateAllocationMock(body) : simulateTransferMock(body),
        );
    }
    return request<SimulateResponse>({ method: 'POST', url: '/blocks/simulate', data: body });
};

/**
 * 블록 추가 (POST /blocks). 잔액 0원으로 홈 맨 뒤에 생긴다.
 * 목업 모드에서는 홈 목업에 블록을 붙인다.
 */
export const createBlock = (body: BlockCreateRequest): Promise<Block> => {
    if (USE_MOCK) {
        return mockResponse(() => createBlockMock(body));
    }
    return request<Block>({ method: 'POST', url: '/blocks', data: body });
};

/**
 * 블록 수정 (PATCH /blocks/{blockId}). 넣은 값만 바뀐다.
 * version을 넣으면 그사이 바뀐 블록은 409 BLOCK_VERSION_CONFLICT로 막힌다.
 * 목업 모드에서는 홈·상세 목업 값을 바꾼다.
 */
export const updateBlock = ({
    blockId,
    patch,
    version,
}: {
    blockId: number;
    patch: BlockPatch;
    version?: number;
}) => {
    if (USE_MOCK) {
        return mockResponse(() => {
            updateBlockMock(blockId, patch, version);
            return null;
        });
    }
    return request<unknown>({
        method: 'PATCH',
        url: `/blocks/${blockId}`,
        data: toBlockUpdateRequest(patch, version),
    });
};

/**
 * 블록 삭제 (DELETE /blocks/{blockId}). 소프트 삭제라 남은 잔액은 '남은 돈' 나눌 돈으로 돌아간다.
 * 기본 블록은 400 BLOCK_DEFAULT_UNDELETABLE.
 */
export const deleteBlock = (blockId: number): Promise<BlockDeleteResponse> => {
    if (USE_MOCK) {
        return mockResponse(() => deleteBlockMock(blockId));
    }
    return request<BlockDeleteResponse>({ method: 'DELETE', url: `/blocks/${blockId}` });
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
 * 배분하기(06 절약분 · 06-C 추가 입금) 초기값: 요약 카드 내역, 넣을 수 있는 블록, 처음 채워 둘 금액
 * TODO: 명세에 없는 API라 경로와 응답을 가정했다. 백엔드와 맞춘 뒤 고친다.
 */
export const getAllocationDraft = async (waitingFundId: number): Promise<AllocationDraft> => {
    const response = USE_MOCK
        ? await mockResponse(() => getAllocationDraftMock(waitingFundId))
        : await request<AllocationDraftResponse>({
              method: 'GET',
              url: `/waiting-funds/${waitingFundId}/allocation-draft`,
          });
    return toAllocationDraft(response);
};

/** 나눌 돈 배분 확정 (06) */
export const allocateWaitingFund = (
    waitingFundId: number,
    body: AllocationRequest,
): Promise<AllocationResponse> => {
    if (USE_MOCK) {
        return mockResponse(() => allocateWaitingFundMock(waitingFundId, body));
    }
    return request<AllocationResponse>({
        method: 'POST',
        url: `/waiting-funds/${waitingFundId}/allocations`,
        data: body,
    });
};

/**
 * 목표 지키기 (16): 늦어지는 목표형 블록을 맞출 방법 목록
 * TODO: 명세에 없는 API라 경로와 응답을 가정했다. 백엔드와 맞춘 뒤 고친다.
 */
export const getGoalGuard = (blockId: number): Promise<GoalGuard> => {
    if (USE_MOCK) {
        return mockResponse(() => getGoalGuardMock(blockId));
    }
    return request<GoalGuard>({ method: 'GET', url: `/blocks/${blockId}/goal-guard` });
};

/** 목표 지키기 반영 (16): 고른 방법을 블록에 바로 반영한다. */
export const applyGoalGuard = (blockId: number, body: ApplyGoalGuardRequest) => {
    if (USE_MOCK) {
        return mockResponse(() => applyGoalGuardMock(blockId, body));
    }
    return request<unknown>({ method: 'POST', url: `/blocks/${blockId}/goal-guard`, data: body });
};

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

/** 고친 블록으로 서버가 합계·하루 쓸 돈·경고를 계산한다. (저장하지 않는다) */
export const previewBlockSetup = async (body: BlockSetupRequest): Promise<BlockSetupPreview> => {
    if (USE_BLOCK_SETUP_MOCK) {
        return delay(() => mockBlockSetupPreview(body), 200);
    }
    const response = await request<BlockProposalPreviewResponse>({
        method: 'POST',
        url: '/blocks/proposals/preview',
        data: { blocks: toPreviewItems(body) },
    });
    return toBlockSetupPreview(response);
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
    if (DEMO_BACKDATE) {
        await backdateConfirmedAt();
    }
    return null;
};

/**
 * 시연 빌드에서만: 확정 직후 확정일을 이번 달 1일로 옮겨 홈·상세 소진 그래프를 채운다.
 * shortcut: 개발 서버 전용 API를 앱이 부른다. 시연 뒤 지우거나, 백엔드가 개발 서버에서 확정일을 잡아주면 지운다.
 */
const DEMO_BACKDATE = process.env.EXPO_PUBLIC_DEMO_BACKDATE === 'true';
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

async function backdateConfirmedAt() {
    const month = new Date(Date.now() + KST_OFFSET_MS).toISOString().slice(0, 7);
    try {
        // 서버가 한 번에 다 옮기지 못하면(skipped > 0) 한 번 더 부른다.
        for (let attempt = 0; attempt < 2; attempt += 1) {
            const { skipped } = await request<{ skipped: number }>({
                method: 'PUT',
                url: '/dev/blocks-confirmed-at',
                data: { confirmedAt: `${month}-01T00:00:00` },
            });
            if (skipped === 0) return;
        }
    } catch {
        // 그래프보다 온보딩 완료가 중요하다. 실패해도 홈으로 넘어간다.
    }
}
