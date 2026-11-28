import { useState } from 'react';
import { View } from 'react-native';

import { formatAmount, formatMonthDay, formatWon } from '@/lib/format';
import { AppText } from '@/shared/components/ui/AppText';
import { Button } from '@/shared/components/ui/Button';
import { colors } from '@/styles/tokens';

import type { GoalBlockDetail } from '@/features/block/types/blockDetail';
import { extendPlan } from '@/features/block/utils/goalOutcome';

import { GoalChoiceCard } from './GoalChoiceCard';

const STATUS_KEY = { SAFE: 'safe', CAUTION: 'caution', DANGER: 'danger' } as const;

type OverdueChoice = 'EXTEND' | 'FINISH_AT_CURRENT' | 'CLEANUP';

interface GoalOverdueContentProps {
    detail: GoalBlockDetail;
    /** 기한 (기한 지남이라 항상 있다) */
    dueDate: string;
    today: string;
    isPending: boolean;
    onExtend: (newDueDate: string) => void;
    onFinish: () => void;
    onCleanup: () => void;
}

/** 17-1 목표 기한 지남 시트 내용 — 기한까지 모은 돈과 이어서 할 일을 고른다. */
export function GoalOverdueContent({
    detail,
    dueDate,
    today,
    isPending,
    onExtend,
    onFinish,
    onCleanup,
}: GoalOverdueContentProps) {
    const { block, targetAmount } = detail;
    const { balance } = block;
    const hasSaved = balance > 0;
    const [choice, setChoice] = useState<OverdueChoice>('EXTEND');
    const plan = extendPlan(targetAmount, balance, today);
    // 달성률은 서버 값(목표형 물 높이 = 달성률)을 그대로 쓴다. (목표 상세와 같은 값)
    const rate = Math.min(100, Math.max(0, block.fillRate));
    const fillColor = colors.block[block.color][STATUS_KEY[block.status]];

    const choices: {
        value: OverdueChoice;
        title: string;
        description: string;
        result?: { value: string; label: string };
        disabled?: boolean;
    }[] = [
        {
            value: 'EXTEND',
            title: '기한 늘리기',
            description: `${formatMonthDay(plan.newDueDate)}까지, 이번 달 ${formatWon(plan.monthlyAmount)} 더 확보`,
            result: { value: formatMonthDay(plan.newDueDate), label: '새 목표일' },
        },
        {
            value: 'FINISH_AT_CURRENT',
            title: '모은 만큼으로 끝내기',
            description: hasSaved
                ? `목표를 ${formatWon(balance)}으로 바꾸고 달성 처리`
                : '모은 돈이 없어서 끝낼 수 없어요',
            // 모은 돈이 없으면 서버가 GOAL_NOTHING_SAVED로 막는다.
            disabled: !hasSaved,
        },
        {
            value: 'CLEANUP',
            title: '블록 정리하기',
            description: hasSaved
                ? `${formatWon(balance)}은 나눌 돈으로 돌리고 ${block.name} 블록은 삭제`
                : `${block.name} 블록을 삭제`,
        },
    ];
    const selected = choices.find((item) => item.value === choice) ?? choices[0];

    const handleConfirm = () => {
        switch (selected.value) {
            case 'EXTEND':
                return onExtend(plan.newDueDate);
            case 'FINISH_AT_CURRENT':
                return onFinish();
            case 'CLEANUP':
                return onCleanup();
        }
    };

    return (
        <View>
            <View
                className="rounded-16 bg-surface-app p-4"
                accessible
                accessibilityLabel={`${formatMonthDay(dueDate)}까지 모은 돈 ${formatWon(balance)}, 목표 ${formatWon(targetAmount)}, ${rate}% 달성, ${formatWon(plan.remaining)} 모자라요`}
            >
                <View className="flex-row items-center justify-between">
                    <AppText className="text-13 text-ink-sub">
                        {`${formatMonthDay(dueDate)}까지 모은 돈`}
                    </AppText>
                    <AppText className="text-13 text-ink-sub">
                        <AppText className="font-bold text-13">
                            {formatAmount(balance, { showUnit: false })}
                        </AppText>
                        {` / ${formatAmount(targetAmount, { showUnit: false })}원`}
                    </AppText>
                </View>
                <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                    <View
                        className="h-full rounded-full"
                        style={{ width: `${rate}%`, backgroundColor: fillColor }}
                    />
                </View>
                <AppText className="mt-2 text-12 text-ink-sub">
                    {`${rate}% 달성  ${formatWon(plan.remaining)} 모자라요`}
                </AppText>
            </View>

            <View accessibilityRole="radiogroup" className="mt-4 gap-2">
                {choices.map((item) => (
                    <GoalChoiceCard
                        key={item.value}
                        title={item.title}
                        description={item.description}
                        result={item.result}
                        isSelected={selected.value === item.value}
                        disabled={isPending || item.disabled}
                        onPress={() => setChoice(item.value)}
                    />
                ))}
            </View>

            <AppText className="mt-4 text-12 text-ink-sub">
                지금 정하지 않으면 블록은 그대로 두고 3일 뒤에 다시 물어볼게요.
            </AppText>

            <Button
                className="mt-10"
                title={selected.title}
                loadingTitle="반영하는 중"
                isLoading={isPending}
                onPress={handleConfirm}
            />
        </View>
    );
}
