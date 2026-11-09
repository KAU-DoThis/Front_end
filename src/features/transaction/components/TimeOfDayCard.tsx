import { View } from 'react-native';

import { AppText } from '@/shared/components/ui/AppText';
import { BarChart } from '@/shared/components/ui/BarChart';
import { Card } from '@/shared/components/ui/Card';
import { colors } from '@/styles/tokens';

import { RichTextView } from '@/features/transaction/components/RichTextView';
import type { SpendingAnalysis } from '@/features/transaction/types/spendingAnalysis';

/** 가장 높은 막대 높이 · 0번일 때 바닥 막대 높이 (시안 11) */
const MAX_BAR_HEIGHT = 92;
const EMPTY_BAR_HEIGHT = 4;

interface TimeOfDayCardProps {
    timeOfDay: NonNullable<SpendingAnalysis['timeOfDay']>;
}

/** 언제 많이 쓰나요? — 시간대별 횟수 막대 (가장 많은 시간대만 청록) */
export function TimeOfDayCard({ timeOfDay }: TimeOfDayCardProps) {
    return (
        <Card>
            <View className="flex-row items-center justify-between">
                <AppText className="font-bold text-15">언제 많이 쓰나요?</AppText>
                <AppText className="text-12 text-ink-sub">{timeOfDay.targetLabel}</AppText>
            </View>
            <RichTextView parts={timeOfDay.headline} className="mt-2 text-15" />

            {/* 막대 높이는 횟수에 비례한다. */}
            <View className="mt-[25px]">
                <BarChart
                    maxBarHeight={MAX_BAR_HEIGHT}
                    minBarHeight={EMPTY_BAR_HEIGHT}
                    radius={{ top: 8, bottom: 4 }}
                    accessibilityLabel={timeOfDay.slots
                        .map(({ label, count }) => `${label} ${count}번`)
                        .join(', ')}
                    bars={timeOfDay.slots.map((slot) => ({
                        key: slot.label,
                        value: slot.count,
                        color: slot.isPeak ? colors.primary[600] : colors.chart[5],
                        valueLabel: `${slot.count}번`,
                        isEmphasized: slot.isPeak,
                        footer: (
                            <>
                                <AppText className="font-semibold text-12">{slot.label}</AppText>
                                <AppText className="text-12 text-ink-sub">{slot.range}</AppText>
                            </>
                        ),
                    }))}
                />
            </View>

            {timeOfDay.footnote && (
                <AppText className="mt-3 text-12 text-ink-sub">{timeOfDay.footnote}</AppText>
            )}
        </Card>
    );
}
