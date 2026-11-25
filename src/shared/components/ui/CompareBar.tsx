import { View } from 'react-native';

import { cn } from '@/lib/cn';
import { formatWon } from '@/lib/format';
import { AppText } from '@/shared/components/ui/AppText';
import { HorizontalBar } from '@/shared/components/ui/HorizontalBar';
import { colors } from '@/styles/tokens';

interface CompareBarProps {
    label: string;
    amount: number;
    /** 두 막대 중 큰 금액 (막대 길이 기준) */
    maxAmount: number;
    isCurrent: boolean;
    /** 지난달 막대 색 (기본: 회색 chart-5, 월간 리포트는 연한 청록) */
    previousColor?: string;
}

/** 지난달 · 이번 달 비교 막대 한 줄. 길이는 금액에 비례한다. */
export function CompareBar({
    label,
    amount,
    maxAmount,
    isCurrent,
    previousColor = colors.chart[5],
}: CompareBarProps) {
    return (
        <View className="flex-row items-center gap-2">
            <AppText className={cn('w-7 text-12', isCurrent ? 'font-bold' : 'text-ink-sub')}>
                {label}
            </AppText>
            <View className="flex-1">
                <HorizontalBar
                    height={10}
                    radius={5}
                    trackColor={colors.line.soft}
                    total={maxAmount}
                    segments={[
                        {
                            key: label,
                            value: amount,
                            color: isCurrent ? colors.primary[600] : previousColor,
                        },
                    ]}
                />
            </View>
            <AppText
                className={cn(
                    'min-w-[64px] text-right text-12',
                    isCurrent ? 'font-bold' : 'text-ink-sub',
                )}
            >
                {formatWon(amount, { showUnit: false })}
            </AppText>
        </View>
    );
}
