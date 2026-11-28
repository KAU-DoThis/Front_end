import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import { formatMonthDay } from '@/lib/format';
import { AppText } from '@/shared/components/ui/AppText';

import type { GoalGuardOption } from '@/features/block/types/goalGuard';

interface GoalGuardOptionCardProps {
    option: GoalGuardOption;
    isSelected: boolean;
    onPress: () => void;
}

/** 맞출 방법 한 개 (라디오 카드). 오른쪽은 이 방법을 쓰면 다 모이는 날 (시안 16) */
export function GoalGuardOptionCard({ option, isSelected, onPress }: GoalGuardOptionCardProps) {
    return (
        <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            onPress={onPress}
            className={cn(
                'flex-row gap-3 rounded-16 bg-white p-4',
                isSelected
                    ? 'border-2 border-primary-700'
                    : 'border border-line active:bg-surface-neutral',
            )}
        >
            <View
                className={cn(
                    'h-5.5 w-5.5 items-center justify-center rounded-full border-2',
                    isSelected ? 'border-primary-700' : 'border-line-control',
                )}
            >
                {isSelected && <View className="h-2.5 w-2.5 rounded-full bg-primary-700" />}
            </View>
            <View className="flex-1">
                {option.isRecommended && (
                    <View className="mb-1 self-start rounded-8 bg-surface-chip px-2 py-0.5">
                        <AppText className="font-semibold text-11 text-ink-sub">
                            에이전트 추천
                        </AppText>
                    </View>
                )}
                <AppText className="font-bold text-15">{option.title}</AppText>
                <AppText className="mt-1 text-13 text-ink-sub">{option.description}</AppText>
            </View>
            <View className="items-end">
                <AppText className="font-bold text-15">{formatMonthDay(option.resultDate)}</AppText>
                <AppText className="mt-0.5 text-12 text-ink-sub">{option.resultLabel}</AppText>
            </View>
        </Pressable>
    );
}
