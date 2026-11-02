import { View } from 'react-native';

import { cn } from '@/lib/cn';
import { formatAmount } from '@/lib/format';
import { AppText } from '@/shared/components/ui/AppText';
import { Card } from '@/shared/components/ui/Card';
import { LineChart } from '@/shared/components/ui/LineChart';
import { colors } from '@/styles/tokens';

import type { SpendingBlockDetail } from '@/features/block/types/blockDetail';

interface BurnRateCardProps {
    burnRate: SpendingBlockDetail['burnRate'];
}

function getPaceText(diffPercent: number) {
    if (diffPercent > 0) {
        return `계획보다 ${diffPercent}% 빠름`;
    }
    if (diffPercent < 0) {
        return `계획보다 ${Math.abs(diffPercent)}% 느림`;
    }
    return '계획대로';
}

/** 소진 속도: 계획선(점선)과 실제 누적 사용(주황 실선) (시안 02) */
export function BurnRateCard({ burnRate }: BurnRateCardProps) {
    const { diffPercent, spentAmount, plannedAmount, totalDays, actual } = burnRate;
    const maxActual = Math.max(0, ...actual.map((point) => point.amount));

    return (
        <Card>
            <View className="flex-row items-center justify-between">
                <AppText className="font-bold text-15">소진 속도</AppText>
                <AppText
                    className={cn(
                        'font-semibold text-12',
                        diffPercent > 0 ? 'text-caution-soft-text' : 'text-primary-700',
                    )}
                >
                    {getPaceText(diffPercent)}
                </AppText>
            </View>
            <View className="mt-3">
                <LineChart
                    height={96}
                    xDomain={[0, totalDays]}
                    yMax={Math.max(plannedAmount, maxActual)}
                    series={[
                        {
                            points: [
                                { x: 0, y: 0 },
                                { x: totalDays, y: plannedAmount },
                            ],
                            color: colors.line.control,
                            width: 1.5,
                            dash: [4, 4],
                        },
                        {
                            points: actual.map((point) => ({ x: point.day, y: point.amount })),
                            color: colors.caution.dot,
                            width: 2.5,
                            endDot: 'filled',
                            dropLine: true,
                        },
                    ]}
                />
            </View>
            <View className="mt-2 flex-row items-center gap-1.5">
                <View className="w-3.5 border-t-2 border-dashed border-line-control" />
                <AppText className="mr-3 text-12 text-ink-sub">계획</AppText>
                <View className="h-[3px] w-3.5 rounded-full bg-caution-dot" />
                <AppText className="text-12 text-ink-sub">
                    실제 사용 {formatAmount(spentAmount)}
                </AppText>
            </View>
        </Card>
    );
}
