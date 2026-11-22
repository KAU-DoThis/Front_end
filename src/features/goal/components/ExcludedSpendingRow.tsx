import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import { formatWon } from '@/lib/format';
import { AppText } from '@/shared/components/ui/AppText';

import type { ExcludedSpending } from '@/features/goal/types/saving';

interface ExcludedSpendingRowProps {
    item: ExcludedSpending;
    /** 다시 포함을 보내는 중이면 버튼을 막는다. */
    isIncluding?: boolean;
    onInclude: (item: ExcludedSpending) => void;
}

/** 후보에서 뺀 지출 한 줄 + 다시 포함 */
export function ExcludedSpendingRow({
    item,
    isIncluding = false,
    onInclude,
}: ExcludedSpendingRowProps) {
    return (
        <View className="flex-row items-center rounded-12 bg-surface-neutral px-4 py-3">
            <View className="flex-1">
                <View className="flex-row items-center gap-2.5">
                    <AppText className="font-semibold text-15">
                        {item.label}
                        {'  '}
                        {formatWon(item.amount)}
                    </AppText>
                    <View className="rounded-8 bg-surface-chip px-2 py-0.5">
                        <AppText className="font-semibold text-12 text-ink-sub">제외됨</AppText>
                    </View>
                </View>
                <AppText className="mt-0.5 text-12 text-ink-sub">{item.reason}</AppText>
            </View>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${item.label} 다시 포함`}
                accessibilityState={{ disabled: isIncluding }}
                disabled={isIncluding}
                hitSlop={6}
                onPress={() => onInclude(item)}
                className="ml-3 h-8 items-center justify-center rounded-8 border border-line-control bg-white px-2 active:bg-surface-chip"
            >
                <AppText
                    className={cn('font-semibold text-13', isIncluding && 'text-ink-disabled')}
                >
                    다시 포함
                </AppText>
            </Pressable>
        </View>
    );
}
