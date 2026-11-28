import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import { AppText } from '@/shared/components/ui/AppText';

interface GoalChoiceCardProps {
    title: string;
    description: string;
    isSelected: boolean;
    onPress: () => void;
    /** 제목 위 작은 칩 (예: 에이전트 추천) */
    badge?: string;
    /** 오른쪽 결과 (예: 1월 31일 / 새 목표일) */
    result?: { value: string; label: string };
    disabled?: boolean;
}

/** 라디오 선택 카드 — 16 목표 지키기 · 17 목표 달성 · 17-1 목표 기한 지남의 방법 고르기 */
export function GoalChoiceCard({
    title,
    description,
    isSelected,
    onPress,
    badge,
    result,
    disabled = false,
}: GoalChoiceCardProps) {
    return (
        <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected, disabled }}
            disabled={disabled}
            onPress={onPress}
            className={cn(
                'flex-row gap-3 rounded-16 bg-white p-4',
                isSelected
                    ? 'border-2 border-primary-700'
                    : 'border border-line active:bg-surface-neutral',
                disabled && 'opacity-40',
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
                {badge && (
                    <View className="mb-1 self-start rounded-8 bg-surface-chip px-2 py-0.5">
                        <AppText className="font-semibold text-11 text-ink-sub">{badge}</AppText>
                    </View>
                )}
                <AppText className="font-bold text-15">{title}</AppText>
                <AppText className="mt-1 text-13 text-ink-sub">{description}</AppText>
            </View>
            {result && (
                <View className="items-end">
                    <AppText className="font-bold text-15">{result.value}</AppText>
                    <AppText className="mt-0.5 text-12 text-ink-sub">{result.label}</AppText>
                </View>
            )}
        </Pressable>
    );
}
