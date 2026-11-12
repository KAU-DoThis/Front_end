import { View } from 'react-native';

import { cn } from '@/lib/cn';
import { formatWon } from '@/lib/format';
import { AmountText } from '@/shared/components/ui/AmountText';
import { AppText } from '@/shared/components/ui/AppText';
import { Card } from '@/shared/components/ui/Card';
import { HorizontalBar } from '@/shared/components/ui/HorizontalBar';
import { colors } from '@/styles/tokens';

import { DeltaBadge } from '@/features/transaction/components/DeltaBadge';
import type { SpendingAnalysis } from '@/features/transaction/types/spendingAnalysis';

/** 분류 색: 1위만 청록, 나머지는 진한 회색부터 (시안 11 분류별 지출 비율) */
// 막대(svg)는 색 값, 목록 점은 className을 쓴다.
const CATEGORY_COLORS = [
    { value: colors.primary[700], className: 'bg-primary-700' },
    { value: colors.chart[2], className: 'bg-chart-2' },
    { value: colors.chart[3], className: 'bg-chart-3' },
    { value: colors.chart[4], className: 'bg-chart-4' },
    { value: colors.chart[5], className: 'bg-chart-5' },
    { value: colors.chart[6], className: 'bg-chart-6' },
];
const getCategoryColor = (index: number) =>
    CATEGORY_COLORS[Math.min(index, CATEGORY_COLORS.length - 1)];

interface SpendingOverviewCardProps {
    analysis: SpendingAnalysis;
}

/** 쓴 돈 합계 · 지난달 비교 · 분류별 비율 막대 · 분류 목록 */
export function SpendingOverviewCard({ analysis }: SpendingOverviewCardProps) {
    const { spent, categories } = analysis;

    return (
        <Card>
            <AppText className="text-13 text-ink-sub">{`${analysis.periodLabel} 쓴 돈`}</AppText>
            <View className="mt-0.5 flex-row items-center gap-2">
                <AmountText amount={spent.amount} className="text-24" />
                {spent.diffAmount !== 0 && (
                    <DeltaBadge diffAmount={spent.diffAmount} diffPercent={spent.diffPercent} />
                )}
            </View>
            {spent.previousAmount !== null && (
                <AppText className="mt-0.5 text-12 text-ink-sub">
                    {`${analysis.compareLabel} ${formatWon(spent.previousAmount)}`}
                </AppText>
            )}

            {categories.length > 0 && (
                <>
                    {/* 칸 너비는 분류 금액에 비례한다. */}
                    <View className="mt-[30px]" importantForAccessibility="no-hide-descendants">
                        <HorizontalBar
                            height={14}
                            radius={7}
                            gap={2}
                            segments={categories.map((category, index) => ({
                                key: category.categoryName,
                                value: category.amount,
                                color: getCategoryColor(index).value,
                            }))}
                        />
                    </View>
                    <View className="mt-[13px]">
                        {categories.map((category, index) => (
                            <View
                                key={category.categoryName}
                                className={cn(
                                    'h-[43px] flex-row items-center gap-3',
                                    index > 0 && 'border-t border-line-soft',
                                )}
                            >
                                <View
                                    className={cn(
                                        'h-2.5 w-2.5 rounded-[3px] border border-ink',
                                        getCategoryColor(index).className,
                                    )}
                                />
                                <AppText numberOfLines={1} className="flex-1 font-semibold text-15">
                                    {category.categoryName}
                                    <AppText className="text-12 text-ink-sub">{` ${category.count}회`}</AppText>
                                </AppText>
                                {category.diffAmount === null ? null : category.diffAmount === 0 ? (
                                    <AppText className="text-12 text-ink-sub">변화 없음</AppText>
                                ) : (
                                    <DeltaBadge diffAmount={category.diffAmount} />
                                )}
                                <AmountText
                                    amount={category.amount}
                                    showUnit={false}
                                    className="min-w-[72px] text-right text-15"
                                />
                            </View>
                        ))}
                    </View>
                </>
            )}
        </Card>
    );
}
