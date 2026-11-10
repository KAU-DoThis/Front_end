import type { BlockColor } from '@/shared/components/ui/BlockBeaker';
import type { Status } from '@/shared/components/ui/StatusTag';

import type {
    BlockAllocationEntry,
    QuickInputBlock,
    QuickInputPreview,
    TransactionBlock,
    TransactionDay,
    TransactionItem,
    TransactionListPage,
    TransactionListParams,
    TransactionStatus,
    TransactionStatusFilter,
} from '@/features/transaction/types/transaction';
import type {
    ManualPreviewResponse,
    TransactionAccountResponse,
    TransactionBlockSourceResponse,
    TransactionFilterParam,
    TransactionListItemResponse,
    TransactionListQuery,
    TransactionListResponse,
    TransactionResponse,
} from '@/features/transaction/types/transactionResponse';

/** 한 번에 받는 거래 수 (서버 최대 100) */
export const TRANSACTION_PAGE_SIZE = 30;

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 한국 날짜 기준 오늘 (yyyy-MM-dd) */
export const todayInKorea = () => new Date(Date.now() + KST_OFFSET_MS).toISOString().slice(0, 10);

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

/** 블록 목록(GET /blocks)에서 색·상태를 찾을 수 있게 blockId로 묶는다. */
export type BlockLookup = Map<number, TransactionBlockSourceResponse>;

export function toBlockLookup(blocks: TransactionBlockSourceResponse[]): BlockLookup {
    return new Map(blocks.map((block) => [block.blockId, block]));
}

/**
 * 블록 점 색·상태. 거래 응답의 블록에는 이름만 있어서 블록 목록에서 채운다.
 * 목록에 없는 블록(지운 블록 등)은 기본 색·안전으로 보여준다.
 */
function toTransactionBlock(blockId: number, name: string, lookup: BlockLookup): TransactionBlock {
    const source = lookup.get(blockId);
    return {
        blockId,
        name: source?.name ?? name,
        color: (source?.color.toLowerCase() ?? 'i') as BlockColor,
        status: (source?.status ?? 'SAFE') as Status,
    };
}

/** "신한카드 ••12" */
function toAccountLabel(account: TransactionAccountResponse) {
    return account.last4
        ? `${account.institutionName} ••${account.last4}`
        : account.institutionName;
}

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

function toTransactionItem(
    item: TransactionListItemResponse,
    transaction: TransactionResponse,
    lookup: BlockLookup,
): TransactionItem {
    const isQuickInput = transaction.source === 'MANUAL';
    // 확인 필요 거래 중 유지·삭제를 고를 수 있는 것 (직접 넣은 거래가 카드 내역에 없을 때 등)
    const canReview =
        transaction.status === 'NEEDS_REVIEW' && (item.reviewActions?.length ?? 0) > 0;
    return {
        transactionId: transaction.transactionId,
        occurredAt: transaction.occurredAt,
        amount: transaction.amount,
        direction: transaction.direction,
        merchantOrPayee: transaction.merchantOrPayee,
        categoryName: transaction.category?.name ?? null,
        isCategoryGuess: transaction.category !== null && transaction.categoryUncertain,
        // 서버는 계좌·카드를 나누지 않고 나간 계좌만 준다. 계좌가 없는 빠른 입력은 현금이다.
        paymentMethod: isQuickInput || transaction.linkedAccount === null ? 'CASH' : 'ACCOUNT',
        isQuickInput,
        contextTag: transaction.contextTagLabel,
        status: STATUS[transaction.status],
        review: canReview ? { type: 'UNMATCHED_MANUAL', message: item.notice ?? '' } : null,
        block:
            transaction.block &&
            toTransactionBlock(transaction.block.blockId, transaction.block.name, lookup),
        isExcluded: transaction.excluded || transaction.isCanceled,
    };
}

/** GET /transactions 응답 → 화면 모양. blocks는 블록 점 색과 블록 필터 목록에 쓴다. */
export function toTransactionListPage(
    response: TransactionListResponse,
    blocks: TransactionBlockSourceResponse[],
): TransactionListPage {
    const { summary, counts, days, hasNext } = response;
    const today = todayInKorea();
    const month = summary.period.from.slice(0, 7);
    const lookup = toBlockLookup(blocks);

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
            pendingCount: summary.provisionalCount,
            incomeAmount: summary.income,
            nextExpectedIncome: summary.nextExpectedIncome,
        },
        counts: { needsReview: counts.needsReview, pending: counts.provisional },
        // TODO: 맥락 질문 API가 나오면 pendingQuestion을 바꿔 넣는다. (지금은 서버가 항상 null)
        agentQuestion: null,
        filterOptions: {
            blocks: blocks.map((block) => toTransactionBlock(block.blockId, block.name, lookup)),
            // TODO: 계좌 고르기 목록은 GET /linked-accounts에서 받는다. 지금은 계좌로 조회했을 때 그 계좌만 있다.
            accounts: summary.account
                ? [
                      {
                          linkedAccountId: summary.account.linkedAccountId,
                          institutionName: summary.account.institutionName,
                          label: toAccountLabel(summary.account),
                      },
                  ]
                : [],
        },
        days: days.map<TransactionDay>((day) => {
            const allocationItem = day.items.find((item) => item.kind === 'ALLOCATION');
            const allocation: BlockAllocationEntry | null = allocationItem?.allocation
                ? {
                      title: allocationItem.allocation.title,
                      blockCount: allocationItem.allocation.blockCount,
                  }
                : null;
            return {
                date: day.date,
                dayTotal: day.dayTotal,
                transactions: day.items.flatMap((item) =>
                    item.kind === 'TRANSACTION' && item.transaction
                        ? [toTransactionItem(item, item.transaction, lookup)]
                        : [],
                ),
                allocation,
            };
        }),
        hasNext,
    };
}

/**
 * 빠른 입력 미리보기 → 화면 모양.
 * - 서버는 분류로 뺄 블록을 정하고 저장 때 블록을 받지 않아서, 고를 수 있는 블록은 정해진 블록 하나뿐이다.
 * - 금액을 못 읽으면(response가 null) 금액 없는 미리보기로 보여주고 기본 블록을 넣는다. (저장 버튼은 막힌다)
 */
export function toQuickInputPreview(
    response: ManualPreviewResponse | null,
    blocks: TransactionBlockSourceResponse[],
): QuickInputPreview | null {
    const lookup = toBlockLookup(blocks);
    const today = todayInKorea();
    const source =
        response?.block ??
        blocks.find((block) => block.isDefault) ??
        // 기본 블록이 없으면 첫 블록 (블록이 하나도 없으면 미리보기를 보여줄 수 없다)
        blocks[0] ??
        null;
    if (!source) {
        return null;
    }
    const block: QuickInputBlock = {
        ...toTransactionBlock(source.blockId, source.name, lookup),
        isDefault: source.isDefault,
    };
    return {
        amount: response?.amount ?? null,
        memo: response?.description ?? null,
        date: response?.occurredDate ?? today,
        today,
        categoryName: response?.category?.name ?? null,
        categoryId: response?.category?.categoryId ?? null,
        block,
        blockOptions: [block],
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
