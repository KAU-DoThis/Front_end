import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { cn } from '@/lib/cn';
import { formatCompactWon, formatMonth, formatWon } from '@/lib/format';
import { AppText } from '@/shared/components/ui/AppText';
import { Card } from '@/shared/components/ui/Card';
import { DeltaBadge } from '@/shared/components/ui/DeltaBadge';
import { LineChart, type ChartSeries } from '@/shared/components/ui/LineChart';
import type { SpendingAnalysis } from '@/shared/types/spendingAnalysis';
import { colors } from '@/styles/tokens';

import type { MonthlyReport } from '@/features/report/types/monthlyReport';

const CHART_HEIGHT = 150;
const CHART_PADDING = { top: 8, bottom: 22, left: 4, right: 36 };
/** 눈금 간격 후보 — 최댓값을 3칸 이하로 나누는 가장 작은 값을 쓴다. */
const GRID_STEPS = [100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000];
/** 가장 큰 값 위 여유 (최댓값 기준) */
const TOP_ROOM = 1.1;

const getGridStep = (max: number) =>
    GRID_STEPS.find((step) => max / step <= 3) ?? GRID_STEPS[GRID_STEPS.length - 1];

const toPoints = (values: number[]) => values.map((y, index) => ({ x: index + 1, y }));

interface LegendItemProps {
    color: string;
    month: string;
    amount: number;
    isCurrent: boolean;
}

function LegendItem({ color, month, amount, isCurrent }: LegendItemProps) {
    return (
        <View className="flex-row items-center gap-2">
            <View className="h-1 w-3.5 rounded-full" style={{ backgroundColor: color }} />
            <AppText className={cn('text-12', isCurrent ? 'font-bold' : 'text-ink-sub')}>
                {month}
            </AppText>
            <AppText className={cn('text-13', isCurrent ? 'font-bold' : 'text-ink-sub')}>
                {formatWon(amount, { showUnit: false })}
            </AppText>
        </View>
    );
}

interface SpendingTrendCardProps {
    month: string;
    previousMonth: string;
    spent: SpendingAnalysis['spent'];
    dailySpending: MonthlyReport['dailySpending'];
}

/** 총 지출 추이 — 날짜별 누적 지출, 지난달과 비교 */
export function SpendingTrendCard({
    month,
    previousMonth,
    spent,
    dailySpending,
}: SpendingTrendCardProps) {
    const { t } = useTranslation('report');
    const monthLabel = formatMonth(`${month}-01`);
    const previousLabel = formatMonth(`${previousMonth}-01`);
    const { current, previous } = dailySpending;

    const lastDay = Math.max(current.length, previous?.length ?? 0, 2);
    const maxValue = Math.max(...current, ...(previous ?? []), 1);
    const step = getGridStep(maxValue);
    const gridValues = Array.from(
        { length: Math.floor(maxValue / step) },
        (_, i) => (i + 1) * step,
    );

    const series: ChartSeries[] = [
        ...(previous
            ? [
                  {
                      points: toPoints(previous),
                      color: colors.primary[100],
                      width: 2.5,
                      endDot: 'filled' as const,
                  },
              ]
            : []),
        { points: toPoints(current), color: colors.primary[600], width: 2.5, endDot: 'filled' },
    ];

    return (
        <Card>
            <View className="flex-row items-center justify-between">
                <AppText className="font-bold text-15">{t('trend.title')}</AppText>
                {spent.previousAmount !== null && spent.diffAmount !== 0 && (
                    <DeltaBadge
                        diffAmount={spent.diffAmount}
                        label={t(spent.diffAmount > 0 ? 'delta.increased' : 'delta.decreased')}
                    />
                )}
            </View>
            <AppText className="mt-0.5 text-12 text-ink-sub">
                {t('trend.caption', { month: previousLabel })}
            </AppText>
            <View className="mt-4" importantForAccessibility="no-hide-descendants">
                <LineChart
                    height={CHART_HEIGHT}
                    padding={CHART_PADDING}
                    xDomain={[1, lastDay]}
                    yMax={maxValue * TOP_ROOM}
                    series={series}
                    gridLines={gridValues.map((y) => ({ y, color: colors.line.soft }))}
                    yLabels={gridValues.map((y) => ({ y, label: formatCompactWon(y) }))}
                    yLabelAlign="right"
                    xLabels={[
                        { x: 1, label: t('trend.firstDay') },
                        { x: 15, label: t('trend.midDay') },
                        { x: lastDay, label: t('trend.lastDay') },
                    ]}
                />
            </View>
            <View className="mt-3 flex-row justify-between">
                {spent.previousAmount !== null ? (
                    <LegendItem
                        color={colors.primary[100]}
                        month={previousLabel}
                        amount={spent.previousAmount}
                        isCurrent={false}
                    />
                ) : (
                    <View />
                )}
                <LegendItem
                    color={colors.primary[600]}
                    month={monthLabel}
                    amount={spent.amount}
                    isCurrent
                />
            </View>
        </Card>
    );
}
