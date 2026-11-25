import { request } from '@/lib/apiClient';
import { USE_MOCK } from '@/lib/mock';

import type { DutchPay, SaveDutchPayRequest } from '@/features/transaction/types/dutchPay';
import type {
    DutchPayRequestBody,
    DutchPayResponse,
} from '@/features/transaction/types/dutchPayResponse';
import type { TransactionResponse } from '@/features/transaction/types/transactionResponse';

import { toDutchPay } from './dutchPayMapper';
import { getBlocksForTransactions, mockResponse } from './transactionApi';
import { toBlockLookup, toSingleTransactionItem } from './transactionMapper';
import {
    getMockDutchPay,
    getMockTransactionItems,
    saveMockDutchPay,
    unlinkMockDutchPay,
} from './transactionMock';

/**
 * 더치페이 하나 (수정·해제 시트). 응답에는 거래 ID·금액만 있어서 거래 내용은 GET /transactions/{id}로 채운다.
 * 없으면 DUTCH_PAY_NOT_FOUND(404)
 */
export const getDutchPay = async (dutchPayId: number): Promise<DutchPay> => {
    if (USE_MOCK) {
        return mockResponse(() => {
            const dutchPay = getMockDutchPay(dutchPayId);
            return {
                dutchPayId,
                payments: getMockTransactionItems(dutchPay.paymentIds),
                received: getMockTransactionItems(dutchPay.receivedIds),
                myShare: dutchPay.myShare,
                isMyShareEdited: dutchPay.editedMyShare !== null,
            };
        });
    }
    const response = await request<DutchPayResponse>({
        method: 'GET',
        url: `/dutch-pays/${dutchPayId}`,
    });
    const ids = [
        ...response.payments.map(({ transactionId }) => transactionId),
        ...response.received.map(({ transactionId }) => transactionId),
    ];
    const [transactions, blocks] = await Promise.all([
        Promise.all(
            ids.map((id) =>
                request<TransactionResponse>({ method: 'GET', url: `/transactions/${id}` }),
            ),
        ),
        // 블록 목록은 점 색에만 쓴다. 받지 못해도 시트는 보여준다.
        getBlocksForTransactions().catch(() => []),
    ]);
    const lookup = toBlockLookup(blocks);
    return toDutchPay(
        response,
        new Map(
            transactions.map((transaction) => [
                transaction.transactionId,
                toSingleTransactionItem(transaction, lookup),
            ]),
        ),
    );
};

/**
 * 더치페이 만들기(POST /dutch-pays)·수정(PATCH /dutch-pays/{id}).
 * 내 몫이 결제 합보다 크면 DUTCH_PAY_INVALID_MY_SHARE(400), 이미 다른 더치페이에 들어간 거래가 있으면 DUTCH_PAY_ALREADY_LINKED(409)
 */
export const saveDutchPay = async ({
    dutchPayId,
    paymentTransactionIds,
    receivedTransactionIds,
    editedMyShare,
}: SaveDutchPayRequest): Promise<null> => {
    if (USE_MOCK) {
        return mockResponse(() => {
            saveMockDutchPay(
                dutchPayId,
                paymentTransactionIds,
                receivedTransactionIds,
                editedMyShare,
            );
            return null;
        });
    }
    const body: DutchPayRequestBody = {
        paymentTransactionIds,
        receivedTransactionIds,
        myShare: editedMyShare,
    };
    await request<DutchPayResponse>(
        dutchPayId === null
            ? { method: 'POST', url: '/dutch-pays', data: body }
            : { method: 'PATCH', url: `/dutch-pays/${dutchPayId}`, data: body },
    );
    return null;
};

/** 더치페이 해제 (DELETE /dutch-pays/{id}). 블록에 돌려놓은 돈과 나눌 돈에 넣은 돈을 다시 뺀다. */
export const deleteDutchPay = async (dutchPayId: number): Promise<null> => {
    if (USE_MOCK) {
        return mockResponse(() => unlinkMockDutchPay(dutchPayId));
    }
    await request<null>({ method: 'DELETE', url: `/dutch-pays/${dutchPayId}` });
    return null;
};
