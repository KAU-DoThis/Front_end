import type { BlockColor } from '@/shared/components/ui/BlockBeaker';
import type { Status } from '@/shared/components/ui/StatusTag';

import type {
    TransactionDay,
    TransactionItem,
    TransactionListPage,
    TransactionListParams,
    TransactionStatus,
    TransactionStatusFilter,
} from '@/features/transaction/types/transaction';
import type {
    TransactionFilterParam,
    TransactionListQuery,
    TransactionListResponse,
    TransactionResponse,
} from '@/features/transaction/types/transactionResponse';

/** 한 번에 받는 거래 수 (서버 최대 100) */
export const TRANSACTION_PAGE_SIZE = 30;

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 한국 날짜 기준 오늘 (yyyy-MM-dd) */
const todayInKorea = () => new Date(Date.now() + KST_OFFSET_MS).toISOString().slice(0, 10);

const FILTER_PARAM: Record<TransactionStatusFilter, TransactionFilterParam> = {
    ALL: 'ALL',
    NEEDS_REVIEW: 'NEEDS_REVIEW',
    PENDING: 'PROVISIONAL',
};

const STATUS: Record<TransactionResponse['status'], TransactionStatus> = {
    CONFIRMED: 'CONFIRMED',
    PROVISIONAL: 'PENDING',
    NEEDS_REVIEW: 'NEEDS_REVIEW',
};

/** 화면 조건 → GET /transactions 쿼리. 값이 없는 조건은 보내지 않는다. */
export function toTransactionListQuery(
    params: TransactionListParams,
    page: number,
): TransactionListQuery {
    return {
        ...(params.month && { month: params.month }),
        ...(params.accountId !== null && { linkedAccountId: params.accountId }),
        ...(params.blockId !== null && { blockId: params.blockId }),
        filter: FILTER_PARAM[params.status],
        page,
        size: TRANSACTION_PAGE_SIZE,
    };
}

function toTransactionItem(transaction: TransactionResponse): TransactionItem {
    return {
        transactionId: transaction.transactionId,
        occurredAt: transaction.occurredAt,
        amount: transaction.amount,
        direction: transaction.direction,
        merchantOrPayee: transaction.merchantName,
        categoryName: transaction.category?.name ?? null,
        isCategoryGuess: transaction.category !== null && transaction.categoryUncertain,
        paymentMethod: transaction.paymentMethod ?? 'ACCOUNT',
        isQuickInput: transaction.inputMethod === '빠른 입력',
        contextTag: transaction.contextTagLabel,
        status: STATUS[transaction.status],
        // TODO: 확인 필요 처리(notice · reviewActions)가 붙으면 유지·삭제 안내로 바꾼다.
        review: null,
        // TODO: 블록 반영(F-21)이 붙으면 색·상태 값을 명세로 맞춘다. (지금은 항상 null)
        block: transaction.block && {
            blockId: transaction.block.blockId,
            name: transaction.block.name,
            color: (transaction.block.color ?? 'i') as BlockColor,
            status: (transaction.block.status ?? 'SAFE') as Status,
        },
        isExcluded: transaction.excluded,
    };
}

/** GET /transactions 응답 → 화면 모양 */
export function toTransactionListPage(response: TransactionListResponse): TransactionListPage {
    const { summary, counts, days, hasNext } = response;
    const today = todayInKorea();
    const month = summary.period.from.slice(0, 7);

    return {
        period: {
            month,
            startDate: summary.period.from,
            endDate: summary.period.to,
            today,
            isCurrentMonth: month === today.slice(0, 7),
        },
        summary: {
            spentAmount: summary.spent,
            // 서버 요약에는 없어서 칩 숫자(계좌·블록만 걸린 임시 건수)를 쓴다.
            pendingCount: counts.provisional,
            incomeAmount: summary.income,
            nextExpectedIncome: summary.nextExpectedIncome,
        },
        counts: { needsReview: counts.needsReview, pending: counts.provisional },
        // TODO: 맥락 질문 API가 나오면 pendingQuestion을 바꿔 넣는다. (지금은 null)
        agentQuestion: null,
        filterOptions: {
            blocks: [],
            accounts: summary.account ? [summary.account] : [],
        },
        days: days.map<TransactionDay>((day) => ({
            date: day.date,
            dayTotal: day.dayTotal,
            transactions: day.transactions.map(toTransactionItem),
            // TODO: 배분 기록(ALLOCATION 항목)이 오면 바꿔 넣는다. (지금은 안 온다)
            allocation: null,
        })),
        hasNext,
    };
}

/**
 * 여러 쪽의 날짜 묶음을 이어 붙인다.
 * 페이지가 거래 단위라 같은 날짜가 두 쪽에 걸치면 거래를 한 묶음으로 합친다. (dayTotal은 그날 전체 기준이라 같다)
 */
export function mergeTransactionDays(pages: TransactionListPage[]): TransactionDay[] {
    const merged: TransactionDay[] = [];
    pages
        .flatMap((page) => page.days)
        .forEach((day) => {
            const last = merged.at(-1);
            if (last?.date === day.date) {
                merged[merged.length - 1] = {
                    ...last,
                    transactions: [...last.transactions, ...day.transactions],
                    allocation: last.allocation ?? day.allocation,
                };
            } else {
                merged.push(day);
            }
        });
    return merged;
}
