import { useRef, type ComponentRef } from 'react';
import { Pressable, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';
import { formatTime, formatWon } from '@/lib/format';
import { AmountText } from '@/shared/components/ui/AmountText';
import { AppText } from '@/shared/components/ui/AppText';
import { getWaterColor } from '@/shared/components/ui/BlockBeaker';
import { Icon } from '@/shared/components/ui/Icon';
import { colors } from '@/styles/tokens';

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
    /**
     * 있으면 행을 왼쪽으로 밀어 '더치페이' 버튼을 연다. (09-3, 아직 묶이지 않은 결제)
     * onPress가 없으면 행을 눌러도 밀려 열린다.
     */
    onSplit?: () => void;
    /** 다른 행을 만지거나 밀면 열린 행을 닫는다. */
    swipeControl?: SwipeControl;
}

/**
 * 밀어서 연 행을 하나만 열어 두기 위한 연결 (TransactionListContent가 만든다)
 * - willOpen: 이 행이 열리기 시작함 → 다른 행이 열려 있으면 닫는다.
 * - didClose: 이 행이 닫힘
 * - closeOthers: 이 행을 만졌다 → 다른 행이 열려 있으면 닫는다.
 */
export interface SwipeControl {
    willOpen: (transactionId: number, close: () => void) => void;
    didClose: (transactionId: number) => void;
    closeOthers: (transactionId: number) => void;
}

/** 밀었을 때 보이는 더치페이 버튼 너비 */
const SPLIT_ACTION_WIDTH = 96;

/** 거래 한 줄 (시안 09). 상태 칩 · 블록 점 · 안내 문구 · 유지/삭제 버튼까지 그린다. */
export function TransactionRow({
    transaction,
    isLast,
    onPress,
    onKeep,
    onDelete,
    isReviewing,
    onSplit,
    swipeControl,
}: TransactionRowProps) {
    const { t } = useTranslation('transaction');
    const swipeRef = useRef<ComponentRef<typeof ReanimatedSwipeable>>(null);
    // 열린 행을 다시 누르면 닫는다.
    const isSwipeOpenRef = useRef(false);
    const badge = transaction.status === 'CONFIRMED' ? null : STATUS_BADGE[transaction.status];
    const unmatched = transaction.review?.type === 'UNMATCHED_MANUAL' ? transaction.review : null;
    const signedAmount = transaction.direction === 'OUT' ? -transaction.amount : transaction.amount;

    // 누를 동작이 없는 결제는 눌러도 더치페이 버튼이 밀려 열린다.
    const canPress = onPress !== undefined || onSplit !== undefined;
    const handlePress = () => {
        if (onPress) {
            onPress();
        } else if (isSwipeOpenRef.current) {
            swipeRef.current?.close();
        } else {
            swipeRef.current?.openRight();
        }
    };

    const row = (
        <Pressable
            disabled={!canPress}
            onPress={handlePress}
            // 누를 수 없는 행이어도 만지면 다른 행의 열린 더치페이 버튼을 닫는다.
            onTouchStart={() => swipeControl?.closeOthers(transaction.transactionId)}
            className={cn(
                'gap-1 px-4 py-3 active:bg-surface-neutral',
                !isLast && 'border-b border-line-soft',
                unmatched ? 'bg-caution-row-bg' : 'bg-white',
            )}
        >
            {/* 쓴 돈에서 뺀 거래(체크카드 결제의 은행 쪽 등)는 내용만 흐리게 보여준다. */}
            <View className={cn('gap-1', transaction.isExcluded && 'opacity-40')}>
                <View className="flex-row items-center gap-2">
                    <AppText numberOfLines={1} className="shrink font-semibold text-15">
                        {transaction.merchantOrPayee ?? '알 수 없는 거래'}
                    </AppText>
                    {transaction.dutchPayId !== null && (
                        <View className="rounded-8 bg-primary-50 px-2 py-0.5">
                            <AppText className="font-semibold text-12 text-ink-safe">
                                {t('dutchPay.title')}
                            </AppText>
                        </View>
                    )}
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
                        {transaction.dutchPayMyShare !== null &&
                            `  ${t('dutchPay.rowMyShare', { amount: formatWon(transaction.dutchPayMyShare, { showUnit: false }) })}`}
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

    if (!onSplit) {
        return row;
    }

    return (
        <ReanimatedSwipeable
            ref={swipeRef}
            friction={2}
            rightThreshold={SPLIT_ACTION_WIDTH / 2}
            overshootRight={false}
            onSwipeableOpenStartDrag={() =>
                swipeControl?.willOpen(transaction.transactionId, () => swipeRef.current?.close())
            }
            onSwipeableWillOpen={() =>
                swipeControl?.willOpen(transaction.transactionId, () => swipeRef.current?.close())
            }
            onSwipeableOpen={() => {
                isSwipeOpenRef.current = true;
            }}
            onSwipeableClose={() => {
                isSwipeOpenRef.current = false;
                swipeControl?.didClose(transaction.transactionId);
            }}
            renderRightActions={() => (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('dutchPay.title')}
                    onPress={() => {
                        swipeRef.current?.close();
                        onSplit();
                    }}
                    style={{ width: SPLIT_ACTION_WIDTH }}
                    className="items-center justify-center gap-1 bg-primary-700 active:bg-primary-800"
                >
                    <Icon name="users" size={20} color={colors.white} />
                    <AppText className="font-semibold text-13 text-white">
                        {t('dutchPay.title')}
                    </AppText>
                </Pressable>
            )}
        >
            {row}
        </ReanimatedSwipeable>
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
