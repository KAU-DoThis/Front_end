import type { BlockType } from '@/features/block/types/block';
import type { BlockColorCode, BlockResponse } from '@/features/block/types/homeResponse';
import type { PendingMoney } from '@/features/block/types/blockHome';

/**
 * 온보딩 블록 구성 API (Back_end BlockProposalResponse·BlockProposalConfirmRequest, API 명세 v4 6장)
 * 화면은 BlockSetupProposal·SetupBlock을 쓰고, blockSetupMapper에서 서로 바꾼다.
 */

/** 블록 규칙 (v4, camelCase). 유형별로 필요한 값만 보낸다. */
export interface ProposalRule {
    /** 사용형 월 배분액 */
    monthlyAmount?: number | null;
    /** 사용형 기간 시작일 (매월 n일) */
    startDay?: number | null;
    /** 목표형 월 확보 금액 */
    monthlyTarget?: number | null;
    /** 고정지출형 납부일 1~31 */
    payDay?: number | null;
    /** 고정지출형 납부액 */
    payAmount?: number | null;
    /** 고정지출형 납부 확인 조건 */
    matchCondition?: {
        payee?: string | null;
        amountMode?: 'EXACT' | 'RANGE' | null;
        minAmount?: number | null;
        maxAmount?: number | null;
        dayWindow?: number | null;
    } | null;
    /** 고정지출형 알림 설정 */
    alerts?: {
        shortageBefore3Days?: boolean | null;
        paidConfirmed?: boolean | null;
    } | null;
}

/** GET /blocks/proposals 제안 블록 */
export interface BlockProposal {
    proposalKey: string;
    type: BlockType;
    name: string;
    icon: string | null;
    color: BlockColorCode;
    isDefault: boolean;
    /** 처음 넣을 금액 */
    balance: number;
    rule: ProposalRule | null;
    /** AI가 제안한 금액. 거래 분석 전이면 null */
    aiSuggestedAmount: number | null;
    /** 최근 3달 평균 지출. 거래 분석 전이면 null */
    recent3mAvg: number | null;
    /** 하루 약 얼마 (월 금액 ÷ 이번 달 일수, 100원 내림) */
    dailyApprox: number;
    /** 고정지출을 어디서 찾았는지 (TRANSACTIONS). 기본안이면 null */
    foundFrom: string | null;
    /** 제안 이유 한 줄 */
    reason: string | null;
}

/** GET /blocks/proposals */
export interface BlockProposalResponse {
    summary: {
        /** 월 평균 수입. 거래 분석 전이면 null */
        monthlyAvgIncome: number | null;
        /** 찾은 반복 송금·결제 수 */
        recurringCount: number;
        /** 연동 계좌 잔액 */
        linkedBalance: number;
        /** 구성안 블록에 나눈 돈 */
        allocated: number;
        /** 나눌 돈으로 남는 돈 */
        unallocated: number;
    };
    proposals: BlockProposal[];
    /** 직접 추가할 수 있는 블록 이름 (저축·비상금·여행) */
    addablePresets: string[];
    /** AI가 구성안을 만들었는지. false면 서버 기본안 */
    aiAvailable: boolean;
}

/** POST /blocks/proposals/confirm 요청 블록. 보낸 순서가 displayOrder가 된다. */
export interface BlockProposalConfirmItem {
    type: BlockType;
    name: string;
    icon?: string | null;
    color?: BlockColorCode | null;
    /** 처음 넣을 금액 */
    balance: number;
    /** 목표형 목표 금액 */
    targetAmount?: number | null;
    /** 사용형=기간 끝(없으면 이번 달 말일), 목표형=기한(필수) */
    dueDate?: string | null;
    rule?: ProposalRule | null;
    isDefault?: boolean;
    createdBy?: 'AI' | 'USER';
}

/** POST /blocks/proposals/preview 요청 블록. 확정 요청 블록에 구성안 키를 붙인다. */
export interface BlockProposalPreviewItem extends BlockProposalConfirmItem {
    proposalKey: string;
}

/** POST /blocks/proposals/preview 응답 */
export interface BlockProposalPreviewResponse {
    linkedBalance: number;
    /** 블록에 나눈 돈 (요청 금액 합) */
    allocated: number;
    /** 나눌 돈으로 남는 돈. 넘치면 음수 */
    unallocated: number;
    blocks: {
        proposalKey: string;
        /** 하루 약 얼마. 사용형만 */
        dailyApprox: number | null;
        /** 경고 문장. 없으면 null */
        warning: string | null;
    }[];
}

/** POST /blocks/proposals/confirm 응답 */
export interface BlockProposalConfirmResponse {
    blocks: BlockResponse[];
    /** 남은 돈이 나눌 돈으로 생긴 것. 남은 게 없으면 빈 배열 */
    waitingFunds: PendingMoney[];
    onboardingStep: 'CONSENT' | 'LINK' | 'TUTORIAL' | 'BLOCKS' | 'DONE';
}
