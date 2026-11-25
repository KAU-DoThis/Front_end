import type { DutchPay, DutchPayPreview } from '@/features/transaction/types/dutchPay';
import type { TransactionItem } from '@/features/transaction/types/transaction';
import type { DutchPayResponse } from '@/features/transaction/types/dutchPayResponse';

const sum = (items: TransactionItem[]) => items.reduce((total, { amount }) => total + amount, 0);

/**
 * 확정 전 미리보기. 미리보기 API가 없어서 서버(DutchPayService)와 같은 식으로 앱에서 계산한다.
 * TODO: 서버에 미리보기 API가 생기면 그 값으로 바꾼다.
 * - 내 몫은 고치지 않았으면 결제 합 - 받은 돈 (0원 밑으로 안 감). 고친 값은 막지 않는다. (결제 합보다 크면 저장할 때 서버가 막는다)
 * - 블록에 돌려놓는 돈은 결제 합 - 내 몫이지만 받은 돈까지만이다. 모자라면 아직 받을 돈으로 남는다.
 * - 받은 돈에서 돌려놓고 남은 돈은 나눌 돈(추가 입금)으로 간다.
 */
export function toDutchPayPreview(
    payments: TransactionItem[],
    received: TransactionItem[],
    editedMyShare: number | null,
): DutchPayPreview {
    const paidTotal = sum(payments);
    const receivedTotal = sum(received);
    const autoMyShare = Math.max(0, paidTotal - receivedTotal);
    const myShare = editedMyShare ?? autoMyShare;
    const settled = Math.min(Math.max(0, paidTotal - myShare), receivedTotal);
    // 블록에 반영되지 않은 결제의 몫은 돌려놓을 블록이 없어서 서버가 나눌 돈으로 보낸다. (결제 금액 비율)
    const blocklessPaid = sum(payments.filter(({ block }) => block === null));
    const returned =
        paidTotal > 0 ? settled - Math.round((settled * blocklessPaid) / paidTotal) : 0;
    return {
        paidTotal,
        receivedTotal,
        autoMyShare,
        myShare,
        returned,
        buffer: receivedTotal - returned,
        outstanding: Math.max(0, paidTotal - myShare - receivedTotal),
    };
}

/**
 * GET /dutch-pays/{id} → 화면 모양. 응답에는 거래 ID·금액만 있어서 거래 내용(이름·시간 등)은 따로 받은 거래로 채운다.
 * 받지 못한 거래는 빠진다.
 */
export function toDutchPay(
    response: DutchPayResponse,
    transactions: Map<number, TransactionItem>,
): DutchPay {
    const pick = (ids: number[]) =>
        ids.flatMap((id) => {
            const item = transactions.get(id);
            return item ? [item] : [];
        });
    return {
        dutchPayId: response.dutchPayId,
        payments: pick(response.payments.map(({ transactionId }) => transactionId)),
        received: pick(response.received.map(({ transactionId }) => transactionId)),
        myShare: response.myShareTotal,
        isMyShareEdited: response.myShareEdited,
    };
}
