import { View } from 'react-native';

import { formatDayHeader, formatWon } from '@/lib/format';
import { AppText } from '@/shared/components/ui/AppText';
import { Icon } from '@/shared/components/ui/Icon';
import { colors } from '@/styles/tokens';

import {
    TransactionRow,
    type SwipeControl,
} from '@/features/transaction/components/TransactionRow';
import type {
    BlockAllocationEntry,
    TransactionDay,
    TransactionItem,
} from '@/features/transaction/types/transaction';

/** 블록 배분 기록 (앱 안에서만 나눈 돈이라 쓴 돈에 안 잡힌다) */
function BlockAllocationCard({ allocation }: { allocation: BlockAllocationEntry }) {
    return (
        <View className="h-[58px] flex-row items-center gap-3 rounded-16 border border-line bg-surface-app px-4">
            <View className="h-8 w-8 items-center justify-center rounded-12 bg-surface-neutral">
                <Icon name="transfer" size={16} color={colors.primary[700]} />
            </View>
            <View className="flex-1">
                <AppText className="font-semibold text-15">{allocation.title}</AppText>
                <AppText numberOfLines={1} className="text-12 text-ink-sub">
                    앱 안에서만 나눈 돈이라 쓴 돈에 안 잡혀요
                </AppText>
            </View>
            <AppText className="font-semibold text-13 text-primary-700">
                {allocation.blockCount}개 블록
            </AppText>
        </View>
    );
}

interface TransactionDaySectionProps {
    day: TransactionDay;
    /** 서버 기준 오늘 (yyyy-MM-dd) */
    today: string;
    onPressTransaction: (transaction: TransactionItem) => void;
    onReview: (transactionId: number, action: 'KEEP' | 'DELETE') => void;
    /** 유지·삭제 요청 중인 거래 */
    reviewingId: number | null;
    /** 결제를 밀어 더치페이 시트를 연다. */
    onSplit: (transaction: TransactionItem) => void;
    /** 더치페이 칩이 붙은 거래를 눌러 수정 시트를 연다. */
    onPressDutchPay: (dutchPayId: number) => void;
    /** 밀어서 연 행을 하나만 열어 둔다. */
    swipeControl: SwipeControl;
}

/** 더치페이로 묶을 수 있는 결제 (쓴 돈에서 뺀 거래·이미 묶인 거래는 안 된다) */
const canSplit = (transaction: TransactionItem) =>
    transaction.direction === 'OUT' && !transaction.isExcluded && transaction.dutchPayId === null;

/** 행을 눌렀을 때 할 일. 더치페이 수정이 먼저, 그다음 맥락 질문 */
function pressHandler(
    transaction: TransactionItem,
    onPressTransaction: (transaction: TransactionItem) => void,
    onPressDutchPay: (dutchPayId: number) => void,
) {
    const { dutchPayId } = transaction;
    if (dutchPayId !== null) {
        return () => onPressDutchPay(dutchPayId);
    }
    if (transaction.review?.type === 'CATEGORY_QUESTION') {
        return () => onPressTransaction(transaction);
    }
    return undefined;
}

/** 날짜 머리글 + 그날 거래 카드 (+ 블록 배분) */
export function TransactionDaySection({
    day,
    today,
    onPressTransaction,
    onReview,
    reviewingId,
    onSplit,
    onPressDutchPay,
    swipeControl,
}: TransactionDaySectionProps) {
    const hasTransactions = day.transactions.length > 0;

    return (
        <View className="gap-2">
            <View className="flex-row items-center justify-between">
                <AppText className="font-bold text-13">{formatDayHeader(day.date, today)}</AppText>
                <AppText className="text-13 text-ink-sub">
                    {hasTransactions
                        ? formatWon(-day.dayTotal, { showSign: true, showUnit: false })
                        : '블록 배분'}
                </AppText>
            </View>
            {hasTransactions && (
                <View className="overflow-hidden rounded-16 border border-line bg-white">
                    {day.transactions.map((transaction, index) => (
                        <TransactionRow
                            key={transaction.transactionId}
                            transaction={transaction}
                            isLast={index === day.transactions.length - 1}
                            onPress={pressHandler(transaction, onPressTransaction, onPressDutchPay)}
                            onSplit={canSplit(transaction) ? () => onSplit(transaction) : undefined}
                            swipeControl={swipeControl}
                            onKeep={() => onReview(transaction.transactionId, 'KEEP')}
                            onDelete={() => onReview(transaction.transactionId, 'DELETE')}
                            isReviewing={reviewingId === transaction.transactionId}
                        />
                    ))}
                </View>
            )}
            {day.allocation && <BlockAllocationCard allocation={day.allocation} />}
        </View>
    );
}
