import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';

import { cn } from '@/lib/cn';
import { formatAmount, formatMonthDay, formatWon } from '@/lib/format';
import { AmountText } from '@/shared/components/ui/AmountText';
import { AppText } from '@/shared/components/ui/AppText';
import { StatusTag } from '@/shared/components/ui/StatusTag';

import type { ActiveSavingGoals, SavingGoalProgress } from '@/features/goal/types/saving';

interface ActiveSavingGoalsCardProps {
    activeGoals: ActiveSavingGoals;
}

/** 진행 중인 목표 (어두운 큰 카드) — 예상 절약액과 목표별 진행 */
export function ActiveSavingGoalsCard({ activeGoals }: ActiveSavingGoalsCardProps) {
    const { confirmDate, expectedSaving, limitSaving, goals } = activeGoals;

    return (
        <View className="rounded-24 bg-primary-900 px-5 pb-5 pt-4">
            <View className="flex-row items-center justify-between">
                <AppText className="text-13 text-primary-100">
                    진행 중인 목표 {goals.length}
                </AppText>
                <AppText className="text-12 text-primary-100">
                    {formatMonthDay(confirmDate)}에 확정
                </AppText>
            </View>
            <View className="mt-2 flex-row items-baseline gap-2">
                <AppText className="font-bold text-24 text-white">
                    약 {formatWon(expectedSaving)}
                </AppText>
                <AppText className="text-13 text-primary-100">아낄 것 같아요</AppText>
            </View>
            <AppText className="mt-1 text-12 text-primary-100">
                지금까지 쓴 속도로 월말까지 쓴다고 봤을 때예요. 한도대로 쓰면{' '}
                {formatWon(limitSaving)}
            </AppText>

            <View className="mt-3 h-px bg-primary-100/25" />
            {goals.map((goal, index) => (
                <SavingGoalItem
                    key={goal.savingGoalId}
                    goal={goal}
                    isLast={index === goals.length - 1}
                />
            ))}
        </View>
    );
}

interface SavingGoalItemProps {
    goal: SavingGoalProgress;
    isLast: boolean;
}

function SavingGoalItem({ goal, isLast }: SavingGoalItemProps) {
    return (
        <View className={cn('pt-4', !isLast && 'border-b border-primary-100/[0.18] pb-4')}>
            <View className="flex-row items-center gap-2">
                <View className="rounded-full bg-white/[0.12] px-3 py-[3.5px]">
                    <AppText className="font-bold text-13 text-white">{goal.category}</AppText>
                </View>
                {goal.onPlan ? (
                    <View className="rounded-8 bg-primary-300/[0.18] px-2 py-0.5">
                        <AppText className="font-semibold text-12 text-primary-300">
                            계획대로
                        </AppText>
                    </View>
                ) : (
                    <StatusTag status="CAUTION" />
                )}
                <AppText className="ml-auto text-13 text-primary-100">
                    지금 속도면{' '}
                    <AmountText
                        amount={goal.paceSaving}
                        tone={goal.paceSaving >= 0 ? 'up' : 'down'}
                        showSign
                        showUnit={false}
                        isOnDark
                        className="text-13"
                    />
                </AppText>
            </View>

            <View className="mt-3 flex-row items-baseline gap-2">
                <AmountText amount={goal.spent} showUnit={false} isOnDark className="text-17" />
                <AppText className="text-13 text-primary-100">
                    / 한도 {formatAmount(goal.limit, { showUnit: false })} 썼어요
                </AppText>
            </View>

            <GoalProgressBar goal={goal} />

            <AppText className="mt-2 text-12 text-primary-100">
                3달 평균 {formatAmount(goal.baseAmount, { showUnit: false })} → 한도{' '}
                {formatAmount(goal.limit, { showUnit: false })}
                {'  '}
                {formatMonthDay(goal.endDate)}까지
            </AppText>
        </View>
    );
}

/** 오늘 마커 위 금액 글자 너비 (시안 100) */
const TODAY_LABEL_WIDTH = 100;

const toRatio = (value: number, total: number) =>
    total > 0 ? Math.min(Math.max(value / total, 0), 1) : 0;

/** 한도 대비 쓴 돈 + 오늘까지 써도 되는 돈(오늘 마커) */
function GoalProgressBar({ goal }: { goal: SavingGoalProgress }) {
    const [width, setWidth] = useState(0);

    const handleLayout = (event: LayoutChangeEvent) => {
        setWidth(event.nativeEvent.layout.width);
    };

    const spentRatio = toRatio(goal.spent, goal.limit);
    const markerLeft = toRatio(goal.spentUntilTodayPlan, goal.limit) * width;
    // 글자는 마커 가운데에 두되 막대 밖으로 나가지 않게 한다.
    const labelLeft = Math.min(
        Math.max(markerLeft - TODAY_LABEL_WIDTH / 2, 0),
        Math.max(width - TODAY_LABEL_WIDTH, 0),
    );

    return (
        <View
            className="mt-2"
            onLayout={handleLayout}
            accessible
            accessibilityLabel={`한도 ${formatWon(goal.limit)} 중 ${formatWon(goal.spent)} 썼어요. 계획대로라면 오늘까지 ${formatWon(goal.spentUntilTodayPlan)}`}
        >
            <View className="h-3.5">
                {width > 0 && (
                    <AppText
                        className="absolute text-center text-12 text-white"
                        style={{ left: labelLeft, width: TODAY_LABEL_WIDTH }}
                    >
                        오늘까지 {formatAmount(goal.spentUntilTodayPlan, { showUnit: false })}
                    </AppText>
                )}
            </View>
            <View className="mt-1.5 h-2 rounded-full bg-primary-100/20">
                <View
                    className={cn(
                        'h-2 rounded-full',
                        goal.onPlan ? 'bg-primary-300' : 'bg-caution',
                    )}
                    style={{ width: `${spentRatio * 100}%` }}
                />
                {width > 0 && (
                    <View
                        className="absolute -top-1 h-4 w-0.5 bg-white"
                        style={{ left: markerLeft - 1 }}
                    />
                )}
            </View>
        </View>
    );
}
