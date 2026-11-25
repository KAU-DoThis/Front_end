/**
 * 더치페이 API 서버 응답·요청 모양 (Back_end feat/더치페이 DutchPayController · dto 기준)
 * 화면은 이 타입을 바로 쓰지 않고 dutchPayMapper로 dutchPay.ts 모양으로 바꿔서 쓴다.
 */

/** POST /dutch-pays · PATCH /dutch-pays/{dutchPayId} 요청 */
export interface DutchPayRequestBody {
    /** 결제(출금) 거래 ID. 1건 이상 */
    paymentTransactionIds: number[];
    /** 받은 돈(입금) 거래 ID. 카카오페이에 있던 내 돈이 섞인 입금도 그대로 고른다. */
    receivedTransactionIds: number[];
    /**
     * 내 몫 합 (쓴 돈으로 잡을 금액). 결제 합보다 클 수 없다.
     * 만들 때 비우면 서버가 정한다(결제 합 - 받은 돈). 수정할 때 비우면 지금 값을 그대로 둔다.
     */
    myShare: number | null;
}

/** 더치페이 결과 (Back_end DutchPayResponse) */
export interface DutchPayResponse {
    dutchPayId: number;
    payments: {
        transactionId: number;
        amount: number;
        /** 내 몫 합을 결제 금액 비율로 나눈 이 결제의 내 몫 */
        myShare: number;
        /** 받은 돈을 돌려놓은 블록 (블록에 반영되지 않은 결제면 null) */
        returnedBlock: { blockId: number; name: string; amount: number } | null;
    }[];
    received: { transactionId: number; amount: number }[];
    /** 결제 합 */
    paidTotal: number;
    /** 받은 돈 합 (결제보다 많을 수 있다) */
    receivedTotal: number;
    /** 내 몫 합 (블록 쓴 돈·소비 분석에 잡히는 금액) */
    myShareTotal: number;
    /** 사용자가 내 몫을 직접 정했으면 true */
    myShareEdited: boolean;
    /** 블록에 돌려놓은 금액 합 (결제 합 - 내 몫, 받은 돈까지만) */
    returnedTotal: number;
    /** 아직 받을 돈 (결제 합 - 내 몫 - 받은 돈) */
    outstandingAmount: number;
    /** 받은 돈 중 나눌 돈으로 넣은 금액 */
    bufferAmount: number;
    /** 그 나눌 돈 (없으면 null) */
    waitingFundId: number | null;
    version: number;
}

/** 더치페이 에러 코드 — 화면 분기는 ApiError.code로 한다. */
export const DUTCH_PAY_ERROR_CODE = {
    /** 내 몫이 결제 합보다 큼 (400) */
    INVALID_MY_SHARE: 'DUTCH_PAY_INVALID_MY_SHARE',
    /** 이미 다른 더치페이에 들어간 거래 (409) */
    ALREADY_LINKED: 'DUTCH_PAY_ALREADY_LINKED',
} as const;
