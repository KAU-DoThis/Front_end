import { View } from 'react-native';

import { cn } from '@/lib/cn';
import { formatAmount, formatMonthDay } from '@/lib/format';
import { AppText } from '@/shared/components/ui/AppText';
import { Card } from '@/shared/components/ui/Card';
import { LineChart } from '@/shared/components/ui/LineChart';
import { colors } from '@/styles/tokens';

import type { GoalBlockDetail } from '@/features/block/types/blockDetail';

interface GoalProjectionCardProps {
    projection: NonNullable<GoalBlockDetail['projection']>;
    targetAmount: number;
    /** 목표 기한 (yyyy-MM-dd) */
    dueDate: string;
}

const toYearMonth = (value: string) => {
    const [year, month] = value.split('-').map(Number);
    return { year, month };
};

/** 차트 x 값: 첫 달 1일을 0으로, 한 달을 1로 센다. (예: 10월 14일 → 2.42) */
function toMonthX(startMonth: string, date: string) {
    const start = toYearMonth(startMonth);
    const [year, month, day] = date.slice(0, 10).split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    return (year - start.year) * 12 + (month - start.month) + (day - 1) / daysInMonth;
}

/** 언제 다 모일까요? — 모은 돈(실선) · 목표대로(회색 점선) · 지금 속도(주황 점선) (시안 02-1) */
export function GoalProjectionCard({ projection, targetAmount, dueDate }: GoalProjectionCardProps) {
    const { startMonth, endMonth, saved, isLate } = projection;
    const monthCount = Math.round(toMonthX(startMonth, `${endMonth}-01`)) + 1;
    const savedPoints = saved.map((point) => ({
        x: toMonthX(startMonth, point.date),
        y: point.amount,
    }));
    const current = savedPoints[savedPoints.length - 1] ?? { x: 0, y: 0 };
    const paceColor = isLate ? colors.caution.dot : colors.primary[300];
    const start = toYearMonth(startMonth);

    return (
        <Card>
            <View className="flex-row items-center justify-between">
                <AppText className="font-bold text-15">언제 다 모일까요?</AppText>
                <AppText
                    className={cn(
                        'font-semibold text-12',
                        isLate ? 'text-caution-soft-text' : 'text-primary-700',
                    )}
                >
                    {projection.paceText}
                </AppText>
            </View>
            <View className="mt-3">
                <LineChart
                    height={128}
                    xDomain={[0, monthCount - 1]}
                    yMax={targetAmount}
                    padding={{ top: 10, bottom: 28, left: 5, right: 13 }}
                    gridLines={[{ y: targetAmount, color: colors.line.soft }]}
                    yLabels={[
                        { y: targetAmount, label: formatAmount(targetAmount, { showUnit: false }) },
                    ]}
                    xLabels={Array.from({ length: monthCount }, (_, index) => ({
                        x: index,
                        label: `${((start.month - 1 + index) % 12) + 1}월`,
                    }))}
                    series={[
                        {
                            points: [
                                current,
                                { x: toMonthX(startMonth, dueDate), y: targetAmount },
                            ],
                            color: colors.ink.disabled,
                            width: 1.5,
                            dash: [4, 4],
                            endDot: 'hollow',
                        },
                        {
                            points: [
                                current,
                                {
                                    x: toMonthX(startMonth, projection.expectedDate),
                                    y: targetAmount,
                                },
                            ],
                            color: paceColor,
                            width: 2,
                            dash: [5, 4],
                            endDot: 'filled',
                        },
                        {
                            points: savedPoints,
                            color: colors.primary[600],
                            width: 2.5,
                            endDot: 'filled',
                        },
                    ]}
                />
            </View>
            <View className="mt-1.5 gap-2">
                <View className="flex-row items-center gap-1.5">
                    <View className="h-[3px] w-3.5 rounded-full bg-primary-600" />
                    <AppText className="mr-3 text-12 text-ink-sub">모은 돈</AppText>
                    <View className="w-3.5 border-t-2 border-dashed border-ink-disabled" />
                    <AppText className="text-12 text-ink-sub">
                        목표대로면 {formatMonthDay(dueDate)}
                    </AppText>
                </View>
                <View className="flex-row items-center gap-1.5">
                    <View
                        className={cn(
                            'w-3.5 border-t-2 border-dashed',
                            isLate ? 'border-caution-dot' : 'border-primary-300',
                        )}
                    />
                    <AppText className="text-12 text-ink-sub">
                        지금 속도면 {projection.expectedLabel}
                    </AppText>
                </View>
            </View>
        </Card>
    );
}
