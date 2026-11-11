import type { Block, BlockType } from '@/features/block/types/block';
import type { BlockColor } from '@/shared/components/ui/BlockBeaker';

// 서버 응답(GET /blocks/proposals)은 blockSetupMapper에서 이 모양으로 바꾼다.

/** AI가 블록을 제안한 근거 문장 */
export interface ProposalReason {
    /** 예: 지난 3개월 매월 25일 전후 김OO님께 60만 원을 보냈어요 */
    text: string;
    /** 문장 안에서 굵게 보여줄 부분 (서버가 정한다. 없으면 빈 배열) */
    highlights: string[];
}

/** 고정지출형: 이 거래가 나가면 납부한 걸로 본다. */
export interface PaymentMatch {
    /** 받는 분 (가린 이름, 예: 김*수) */
    counterparty: string;
    minAmount: number;
    maxAmount: number;
}

/** 온보딩에서 고치는 블록 한 개 (확정 전이라 아직 blockId가 없다) */
export interface SetupBlock {
    /** 화면에서 블록을 구분하는 값 (서버 제안 id, 직접 추가한 블록은 앱이 만든 값) */
    key: string;
    type: BlockType;
    name: string;
    color: BlockColor;
    /** 기본 사용형 블록. 뺄 수 없고 유형도 바꿀 수 없다. */
    isDefault: boolean;
    /** 홈 블록과 같은 값. AI: AI 제안(기본 블록이 아니면 '거래에서 찾음') · USER: 직접 추가 */
    createdBy: Block['createdBy'];
    reason: ProposalReason | null;
    /** 사용형: 한 달 금액 · 고정지출형: 납부 금액 · 목표형: 한 달 모을 금액 (비어 있으면 null) */
    amount: number | null;
    /** 목표형: 모을 목표 금액 (그 외 null) */
    targetAmount: number | null;
    /** 목표형: 기한 (고른 달의 말일, yyyy-MM-dd. 그 외 null) */
    dueDate: string | null;
    /** 고정지출형 납부일 1~31 */
    payDay: number | null;
    paymentMatch: PaymentMatch | null;
    /** 고정지출형: 납부 3일 전까지 돈이 모자라면 알려주기 */
    notifyShortage: boolean;
    /** 사용형 기간 시작일 1~28 (1이면 매월 1일부터 말일까지) */
    periodStartDay: number | null;
}

/** 3개월 거래를 보고 나눈 AI 제안 */
export interface BlockSetupProposal {
    /** 월 평균 수입. 거래 분석 전이면 null */
    monthlyIncome: number | null;
    /** 찾은 반복 송금·결제 수 */
    recurringPaymentCount: number;
    /** 구성안을 받을 때의 연동 계좌 잔액 (미리보기에서 잔액을 새로 받지 못하면 쓴다) */
    linkedBalance: number;
    blocks: SetupBlock[];
}

/**
 * 지금 고친 블록으로 계산한 결과. 금액을 바꿀 때마다 300ms 쉬었다가 다시 요청한다. (디자인 시스템 '카드 공통 컴포넌트')
 * 합계·하루 쓸 돈·경고 문장은 서버가 계산한 값을 그대로 쓴다.
 */
export interface BlockSetupPreview {
    /** 연동 계좌 잔액 */
    linkedBalance: number;
    /** 블록에 나눈 돈 */
    allocatedAmount: number;
    /** 나눌 돈 (잔액 − 나눈 돈. 넘치면 음수) */
    remainingAmount: number;
    blocks: {
        key: string;
        /** 사용형 하루 쓸 돈 (그 외 null) */
        dailyBudget: number | null;
        /** 주의 문장 (예: 최근 3달 평균보다 220,000원 적어요. 소진 주의 알림이 자주 올 수 있어요.) */
        warning: string | null;
    }[];
}

/**
 * 미리보기·확정 요청에 담는 블록. 확정하면 홈 블록이 되므로 홈 Block 모양에 맞춘다.
 * (유형별 값은 rule에, 순서는 displayOrder에. Block에 자리가 없는 값만 따로 보낸다)
 */
export type SetupBlockInput = Pick<
    Block,
    'type' | 'name' | 'isDefault' | 'targetAmount' | 'rule' | 'createdBy' | 'displayOrder'
> & {
    /** 미리보기 결과를 화면 블록에 붙일 때 쓰는 값 */
    key: string;
    /** 블록 고정 색 (HomeBlock.color와 같은 값) */
    color: BlockColor;
    /** 사용형 한 달 금액 */
    monthlyBudget: number | null;
    /** 사용형 기간 시작일 1~28 */
    periodStartDay: number | null;
    /** 고정지출형: 납부 3일 전까지 돈이 모자라면 알려주기 */
    notifyShortage: boolean;
    /** 고정지출형: 납부 확인 조건 (받는 분·금액 범위). 확정 요청에 그대로 보낸다. */
    paymentMatch: PaymentMatch | null;
    /** 목표형: 기한 (yyyy-MM-dd) */
    dueDate: string | null;
};

export interface BlockSetupRequest {
    /** 화면 순서 그대로 보낸다. */
    blocks: SetupBlockInput[];
}
