import type { TransactionItem } from '@/features/transaction/types/transaction';

// 더치페이 (03-4 · 시안 ③-1). 정산이 끝난 뒤 대표 결제와 정산으로 받은 입금을 묶어
// 블록 쓴 돈·소비 분석에는 내 몫만 잡고, 나머지는 생활비 블록 복구와 나눌 돈으로 돌린다.
// 서버 응답(dutchPayResponse.ts)은 dutchPayMapper에서 이 모양으로 바꾼다.

/** 이미 만든 더치페이 (수정·해제 시트에서 보여준다) */
export interface DutchPay {
    dutchPayId: number;
    payments: TransactionItem[];
    received: TransactionItem[];
    /** 내 몫 합 */
    myShare: number;
    /** 사용자가 내 몫을 직접 고쳤으면 true (아니면 결제 합 - 받은 돈으로 계산한 값) */
    isMyShareEdited: boolean;
}

/** 시트에서 확정 전에 보여주는 계산 (서버 계산식과 같다) */
export interface DutchPayPreview {
    paidTotal: number;
    receivedTotal: number;
    /** 결제 합 - 받은 돈 (0원 밑으로 가지 않는다) */
    autoMyShare: number;
    /** 지금 내 몫 (고쳤으면 고친 값, 아니면 autoMyShare) */
    myShare: number;
    /** 결제가 반영된 블록(생활비 등)에 돌려놓는 돈 = 결제 합 - 내 몫 (받은 돈까지만) */
    returned: number;
    /** 받은 돈 중 돌려놓고 남아 나눌 돈(추가 입금)으로 가는 돈 */
    buffer: number;
    /** 아직 받을 돈 (결제 합 - 내 몫 - 받은 돈) */
    outstanding: number;
}

/** 만들기·수정 요청 */
export interface SaveDutchPayRequest {
    /** 수정이면 있다. */
    dutchPayId: number | null;
    paymentTransactionIds: number[];
    receivedTransactionIds: number[];
    /**
     * 사용자가 고친 내 몫. 고치지 않았으면 null
     * - 만들 때 null이면 서버가 결제 합 - 받은 돈으로 정한다.
     * - 수정할 때 null이면 자동 계산 상태는 그대로 자동(바뀐 거래로 다시 계산), 직접 고친 상태는 고친 값을 그대로 둔다.
     */
    editedMyShare: number | null;
    /** 직접 고쳤던 내 몫을 자동 계산값으로 되돌린다. (수정 후 PATCH /dutch-pays/{id}/my-share에 null을 보낸다) */
    resetMyShare: boolean;
}
