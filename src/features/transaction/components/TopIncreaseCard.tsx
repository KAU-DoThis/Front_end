import { View } from 'react-native';

import { AppText } from '@/shared/components/ui/AppText';
import { Card } from '@/shared/components/ui/Card';
import { CompareBar } from '@/shared/components/ui/CompareBar';
import { DeltaBadge } from '@/shared/components/ui/DeltaBadge';
import type { SpendingAnalysis } from '@/shared/types/spendingAnalysis';

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
