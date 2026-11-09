import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import { formatTime } from '@/lib/format';
import { AmountText } from '@/shared/components/ui/AmountText';
import { AppText } from '@/shared/components/ui/AppText';
import { getWaterColor } from '@/shared/components/ui/BlockBeaker';

import type { TransactionItem } from '@/features/transaction/types/transaction';

const STATUS_BADGE = {
    PENDING: { label: '임시', container: 'bg-surface-chip', text: 'text-ink-sub' },
    NEEDS_REVIEW: {
        label: '확인 필요',
        container: 'bg-caution-soft-bg',
        text: 'text-caution-soft-text',
    },
} as const;

/** 둘째 줄 왼쪽: "편의점  빠른 입력  12:41" (분류가 없는 현금은 "현금") */
function getSubtitle(transaction: TransactionItem) {
    const category = transaction.categoryName
        ? `${transaction.categoryName}${transaction.isCategoryGuess ? '?' : ''}`
        : transaction.paymentMethod === 'CASH'
          ? '현금'
          : null;
    return [category, transaction.isQuickInput && '빠른 입력', formatTime(transaction.occurredAt)]
        .filter(Boolean)
        .join('  ');
}

interface TransactionRowProps {
    transaction: TransactionItem;
    isLast: boolean;
    /** 분류를 묻는 거래를 누르면 답변 시트를 연다. */
    onPress?: () => void;
    /** 카드 내역에 없는 직접 넣은 거래: 유지 · 삭제 */
    onKeep: () => void;
    onDelete: () => void;
    /** 유지·삭제 요청 중이면 버튼을 막는다. */
    isReviewing: boolean;
}

/** 거래 한 줄 (시안 09). 상태 칩 · 블록 점 · 안내 문구 · 유지/삭제 버튼까지 그린다. */
export function TransactionRow({
    transaction,
    isLast,
    onPress,
    onKeep,
    onDelete,
    isReviewing,
}: TransactionRowProps) {
    const badge = transaction.status === 'CONFIRMED' ? null : STATUS_BADGE[transaction.status];
    const unmatched = transaction.review?.type === 'UNMATCHED_MANUAL' ? transaction.review : null;
    const signedAmount = transaction.direction === 'OUT' ? -transaction.amount : transaction.amount;

    return (
        <Pressable
            disabled={!onPress}
            onPress={onPress}
            className={cn(
                'gap-1 px-4 py-3 active:bg-surface-neutral',
                !isLast && 'border-b border-line-soft',
                unmatched && 'bg-caution-row-bg',
            )}
        >
            {/* 쓴 돈에서 뺀 거래(체크카드 결제의 은행 쪽 등)는 내용만 흐리게 보여준다. */}
            <View className={cn('gap-1', transaction.isExcluded && 'opacity-40')}>
                <View className="flex-row items-center gap-2">
                    <AppText numberOfLines={1} className="shrink font-semibold text-15">
                        {transaction.merchantOrPayee ?? '알 수 없는 거래'}
                    </AppText>
                    {badge && (
                        <View className={cn('rounded-8 px-2 py-0.5', badge.container)}>
                            <AppText className={cn('font-semibold text-12', badge.text)}>
                                {badge.label}
                            </AppText>
                        </View>
                    )}
                    <AmountText
                        amount={signedAmount}
                        tone={transaction.direction === 'IN' ? 'up' : 'default'}
                        showSign={transaction.direction === 'IN'}
                        showUnit={false}
                        className="ml-auto text-15"
                    />
                </View>
                <View className="flex-row items-center gap-3">
                    <AppText numberOfLines={1} className="flex-1 text-12 text-ink-sub">
                        {getSubtitle(transaction)}
                        {transaction.contextTag && (
                            <AppText className="text-12 text-primary-700">{`  ${transaction.contextTag}`}</AppText>
                        )}
                    </AppText>
                    {transaction.block && (
                        <View className="flex-row items-center gap-1.5">
                            <View
                                className="h-2 w-2 rounded-[3px]"
                                style={{
                                    backgroundColor: getWaterColor(
                                        transaction.block.color,
                                        transaction.block.status,
                                    ),
                                }}
                            />
                            <AppText className="text-12 text-ink-sub">
                                {transaction.block.name}
                            </AppText>
                        </View>
                    )}
                </View>
            </View>
            {transaction.status === 'PENDING' && (
                <AppText className="text-12 text-ink-sub">
                    카드 내역이 들어오면 자동으로 확정돼요
                </AppText>
            )}
            {unmatched && (
                <>
                    <AppText className="text-12 text-ink-sub">{unmatched.message}</AppText>
                    <View className="mt-2 flex-row gap-2">
                        <ReviewButton
                            title="유지"
                            isPrimary
                            onPress={onKeep}
                            disabled={isReviewing}
                        />
                        <ReviewButton title="삭제" onPress={onDelete} disabled={isReviewing} />
                    </View>
                </>
            )}
        </Pressable>
    );
}

interface ReviewButtonProps {
    title: string;
    /** 유지는 진한 글씨, 삭제는 보조 글씨 */
    isPrimary?: boolean;
    disabled: boolean;
    onPress: () => void;
}

/** 유지 · 삭제 (높이 36 · 모서리 8) */
function ReviewButton({ title, isPrimary = false, disabled, onPress }: ReviewButtonProps) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            disabled={disabled}
            hitSlop={4}
            onPress={onPress}
            className={cn(
                'h-9 items-center justify-center rounded-8 border border-line-control bg-white px-[11.5px] active:bg-surface-chip',
                disabled && 'opacity-50',
            )}
        >
            <AppText
                className={cn('text-13', isPrimary ? 'font-semibold text-ink' : 'text-ink-sub')}
            >
                {title}
            </AppText>
        </Pressable>
    );
}
