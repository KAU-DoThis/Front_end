import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import { formatTime } from '@/lib/format';
import { AmountText } from '@/shared/components/ui/AmountText';
import { AppText } from '@/shared/components/ui/AppText';
import { Icon } from '@/shared/components/ui/Icon';
import { colors } from '@/styles/tokens';

import type { TransactionItem } from '@/features/transaction/types/transaction';

/** "10/11 19:40" (날짜를 같이 보여줄 때) */
function formatShortDateTime(dateTime: string) {
    return `${Number(dateTime.slice(5, 7))}/${Number(dateTime.slice(8, 10))} ${formatTime(dateTime)}`;
}

interface DutchPayTransactionRowProps {
    transaction: TransactionItem;
    isLast: boolean;
    /** 시트 목록은 날짜까지, 고르기 목록은 날짜 머리글이 있어 시간만 보여준다. */
    showDate?: boolean;
    /** 있으면 왼쪽에 체크 상자를 그린다. (고르기 목록) */
    isSelected?: boolean;
    onPress?: () => void;
}

/** 더치페이 시트·고르기 목록의 거래 한 줄 (내역 09 행과 같은 글자 크기) */
export function DutchPayTransactionRow({
    transaction,
    isLast,
    showDate = true,
    isSelected,
    onPress,
}: DutchPayTransactionRowProps) {
    const isSelectable = isSelected !== undefined;
    const isIncome = transaction.direction === 'IN';
    const subtitle = [
        showDate ? formatShortDateTime(transaction.occurredAt) : formatTime(transaction.occurredAt),
        transaction.accountName,
    ]
        .filter(Boolean)
        .join('  ');

    return (
        <Pressable
            disabled={!onPress}
            onPress={onPress}
            accessibilityRole={isSelectable ? 'checkbox' : undefined}
            accessibilityState={isSelectable ? { checked: isSelected } : undefined}
            className={cn(
                'flex-row items-center gap-3 px-4 py-3 active:bg-surface-neutral',
                !isLast && 'border-b border-line-soft',
                isSelected && 'bg-surface-app',
            )}
        >
            {isSelectable && (
                <View
                    className={cn(
                        'h-5.5 w-5.5 items-center justify-center rounded-[7px]',
                        isSelected
                            ? 'bg-primary-700'
                            : 'border-[1.5px] border-line-disabled bg-white',
                    )}
                >
                    {isSelected && (
                        <Icon name="check" size={13} color={colors.white} strokeWidth={1.9} />
                    )}
                </View>
            )}
            <View className="flex-1 gap-1">
                <AppText numberOfLines={1} className="font-semibold text-15">
                    {transaction.merchantOrPayee ?? '-'}
                </AppText>
                <AppText numberOfLines={1} className="text-12 text-ink-sub">
                    {subtitle}
                </AppText>
            </View>
            <AmountText
                amount={isIncome ? transaction.amount : -transaction.amount}
                tone={isIncome ? 'up' : 'default'}
                showSign={isIncome}
                showUnit={false}
                className="text-15"
            />
        </Pressable>
    );
}
