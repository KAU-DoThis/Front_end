import { View } from 'react-native';

import { cn } from '@/lib/cn';
import { formatAmount } from '@/lib/format';
import { AppText } from '@/shared/components/ui/AppText';
import { Card } from '@/shared/components/ui/Card';
import { HorizontalBar } from '@/shared/components/ui/HorizontalBar';
import { colors } from '@/styles/tokens';

import { DeltaBadge } from '@/features/transaction/components/DeltaBadge';
import type { SpendingAnalysis } from '@/features/transaction/types/spendingAnalysis';

interface CompareBarProps {
    label: string;
    amount: number;
    /** 두 막대 중 큰 금액 (막대 길이 기준) */
    maxAmount: number;
    isCurrent: boolean;
}

/** 지난달 · 이번 달 비교 막대 한 줄. 길이는 금액에 비례한다. */
function CompareBar({ label, amount, maxAmount, isCurrent }: CompareBarProps) {
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
                            color: isCurrent ? colors.primary[600] : colors.chart[5],
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
                {formatAmount(amount, { showUnit: false })}
            </AppText>
        </View>
    );
}

interface TopIncreaseCardProps {
    compareLabel: string;
    topIncrease: NonNullable<SpendingAnalysis['topIncrease']>;
}

/** 가장 많이 늘어난 곳 */
export function TopIncreaseCard({ compareLabel, topIncrease }: TopIncreaseCardProps) {
    const maxAmount = Math.max(topIncrease.previousAmount, topIncrease.currentAmount);

    return (
        <Card>
            <View className="flex-row items-center justify-between">
                <AppText className="font-bold text-15">가장 많이 늘어난 곳</AppText>
                <AppText className="text-12 text-ink-sub">{`${compareLabel} 대비`}</AppText>
            </View>
            <View className="mt-3 flex-row items-center gap-2">
                <AppText className="font-bold text-17">{topIncrease.categoryName}</AppText>
                <DeltaBadge
                    diffAmount={topIncrease.diffAmount}
                    diffPercent={topIncrease.diffPercent}
                />
            </View>
            <View className="mt-3 gap-2">
                <CompareBar
                    label={topIncrease.previousLabel}
                    amount={topIncrease.previousAmount}
                    maxAmount={maxAmount}
                    isCurrent={false}
                />
                <CompareBar
                    label={topIncrease.currentLabel}
                    amount={topIncrease.currentAmount}
                    maxAmount={maxAmount}
                    isCurrent
                />
            </View>
            <AppText className="mt-3 text-13 leading-[19.5px] text-ink-sub">
                {topIncrease.message}
            </AppText>
        </Card>
    );
}
