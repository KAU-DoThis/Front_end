import type { PendingMoney } from '@/features/block/types/blockHome';
import type { TransferResultBlock } from '@/features/block/types/blockTransfer';
import type { BlockColor } from '@/shared/components/ui/BlockBeaker';
import type { Status } from '@/shared/components/ui/StatusTag';

/**
 * 나눌 돈(대기 자금) 목록·배분 (Back_end WaitingFundController, API 명세 v4 6-1장)
 * 목록 한 건은 홈과 같은 PendingMoney(서버 WaitingFundResponse 그대로)다.
 */

/** GET /waiting-funds */
export interface WaitingFundListResponse {
    /** 남은 금액이 있는 것만, 생긴 순서 */
    waitingFunds: PendingMoney[];
    /** 남은 금액 합계 */
    total: number;
}

/** 남은 돈 처리. KEEP: 나눌 돈에 남김(기본), DEFAULT_BLOCK: 생활비(기본 블록)에 넣기 */
export type LeftoverTo = 'KEEP' | 'DEFAULT_BLOCK';

/** POST /waiting-funds/{waitingFundId}/allocations */
export interface AllocationRequest {
    allocations: {
        blockId: number;
        amount: number;
        /** 미리보기(POST /blocks/simulate)에서 받은 블록 version. 바뀌었으면 409 */
        version: number;
    }[];
    leftoverTo?: LeftoverTo;
    /** 다음 정기 입금부터 이대로 나누기. 서버가 아직 저장하지 않는다. */
    autoAllocateNextTime?: boolean;
}

export interface AllocationResponse {
    waitingFund: {
        waitingFundId: number;
        /** 남은 금액. 0이면 홈 카드가 사라진다. */
        amount: number;
    };
    /** 배분받은 블록 */
    blocks: TransferResultBlock[];
    /** 기본 사용형 블록 기준 오늘 쓸 수 있는 돈 */
    dailyGuide: { todayAvailable: number; todayRemaining: number } | null;
}

/** 요약 카드 아래 내역 한 줄 (예: 배달 52,000) */
export interface AllocationBreakdownItem {
    label: string;
    amount: number;
}

/** 배분하기 화면에서 돈을 넣을 수 있는 블록 한 줄. 서버 응답 모양 */
export interface AllocationTargetResponse {
    blockId: number;
    /** 줄 이름. 기본 블록은 서버가 '생활비에 그냥 두기'처럼 바꿔 준다. */
    title: string;
    /** 이름 아래 문구 (예: 이번 달 80,000원 부족, 목표를 다 채웠어요). 없으면 null */
    caption: string | null;
    /** 블록 색 (서버는 대문자 I · O · T · S · Z · J · L) */
    color: Uppercase<BlockColor>;
    status: Status;
    /** 물 높이 0~100 */
    fillRate: number;
    /** 기본 사용형 블록 (생활비). 상태 앞말(주의 등)을 붙이지 않는다. */
    isDefault: boolean;
    /** false면 더 넣을 필요가 없는 블록 (목표를 다 채움 등). 흐리게 보여주고 입력을 막는다. */
    canReceive: boolean;
    /** 처음에 채워 둘 금액 */
    suggestedAmount: number;
    /** 확정 요청에 그대로 보낸다. (동시 수정 방지) */
    version: number;
}

/** 화면에서 쓰는 블록 한 줄. 색은 비커 색(소문자)으로 바꿔 둔다. */
export type AllocationTarget = Omit<AllocationTargetResponse, 'color'> & { color: BlockColor };

/**
 * GET /waiting-funds/{waitingFundId}/allocation-draft — 배분하기(06 절약분 · 06-C 추가 입금) 초기값
 * TODO: 명세에 없는 API라 가정한 모양이다. 백엔드와 맞춘 뒤 고친다.
 */
export interface AllocationDraftResponse {
    waitingFund: PendingMoney;
    /** 요약 카드 아래 내역. 절약분이면 목표별 절약액, 없으면 빈 배열 */
    breakdown: AllocationBreakdownItem[];
    /** 요약 카드 맨 아래 안내 (예: 아낀 돈은 생활비에서 꺼내서 나눠요). 없으면 null */
    note: string | null;
    /** 넣을 수 있는 블록부터, 다 채운 블록은 뒤에 */
    targets: AllocationTargetResponse[];
}

export type AllocationDraft = Omit<AllocationDraftResponse, 'targets'> & {
    targets: AllocationTarget[];
};

/** 배분 에러 코드 — 화면 분기는 ApiError.code로 한다. */
export const WAITING_FUND_ERROR_CODE = {
    NOT_FOUND: 'WAITING_FUND_NOT_FOUND',
    INSUFFICIENT: 'WAITING_FUND_INSUFFICIENT',
    VERSION_CONFLICT: 'WAITING_FUND_VERSION_CONFLICT',
} as const;
