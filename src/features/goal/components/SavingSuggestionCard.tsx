import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import { formatAmount, formatWon } from '@/lib/format';
import { AppText } from '@/shared/components/ui/AppText';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';

import type { SavingSuggestion } from '@/features/goal/types/saving';

interface SavingSuggestionCardProps {
    suggestion: SavingSuggestion;
    /** 관심 없음을 보내는 중이면 버튼을 막는다. */
    isDismissing?: boolean;
    onDismiss: (suggestionId: number) => void;
    /** 목표로 설정 → 절약 목표 설정 시트(12, GET /saving-goals/draft?suggestionId=) */
    onSetGoal?: (suggestionId: number) => void;
}

/**
 * 행동 문구에서 바꿀 목표 부분만 굵게 나눈다. (서버 문구는 그대로 두고 표시만 나눈다)
 * "월 6회 → 월 3회로 줄이기" → ["월 6회 → ", "월 3회", "로 줄이기"]
 * "2개 중 1개만 유지하기" → ["2개 중 ", "1개만", " 유지하기"]
 * 모양이 다르면 나누지 않는다.
 */
function splitAction(action: string): [string, string, string] | null {
    const match =
        action.match(/^(.*→\s*)(.+?)(로\s.*)$/) ?? action.match(/^(\d+개 중\s)(\S+)(\s.*)$/);
    return match ? [match[1], match[2], match[3]] : null;
}

/** 줄일 수 있는 지출 카드 (05 절약 후보) */
export function SavingSuggestionCard({
    suggestion,
    isDismissing = false,
    onDismiss,
    onSetGoal,
}: SavingSuggestionCardProps) {
    const { suggestionId, category, reason, reasonLabel, action } = suggestion;
    const actionParts = splitAction(action);
    const baseText = suggestion.baseCount
        ? `3달 평균 ${formatWon(suggestion.baseAmount)}  ${suggestion.baseCount}`
        : `매달 ${formatWon(suggestion.baseAmount)}`;

    return (
        <Card>
            <View className="flex-row items-center justify-between">
                <AppText className="font-bold text-15">{category.name}</AppText>
                <View
                    className={cn(
                        'rounded-8 px-2 py-0.5',
                        reason === 'INCREASED' ? 'bg-danger-bg' : 'bg-surface-neutral',
                    )}
                >
                    <AppText
                        className={cn(
                            'font-semibold text-12',
                            reason === 'INCREASED' ? 'text-danger-text' : 'text-ink-sub',
                        )}
                    >
                        {reasonLabel}
                    </AppText>
                </View>
            </View>

            <AppText className="mt-2 text-15">
                {actionParts ? (
                    <>
                        {actionParts[0]}
                        <AppText className="font-bold text-15">{actionParts[1]}</AppText>
                        {actionParts[2]}
                    </>
                ) : (
                    action
                )}
            </AppText>

            <View className="mt-2 flex-row items-center justify-between">
                <AppText className="text-12 text-ink-sub">{baseText}</AppText>
                <AppText className="font-bold text-13">
                    월 약 {formatAmount(suggestion.expectedSaving, { showUnit: false })}
                </AppText>
            </View>

            <View className="mt-3 flex-row items-center gap-2">
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${category.name} 관심 없음`}
                    accessibilityState={{ disabled: isDismissing }}
                    disabled={isDismissing}
                    onPress={() => onDismiss(suggestionId)}
                    className="h-10 flex-1 items-center justify-center rounded-12 active:bg-surface-neutral"
                >
                    <AppText
                        className={cn(
                            'text-13',
                            isDismissing ? 'text-ink-disabled' : 'text-ink-sub',
                        )}
                    >
                        관심 없음
                    </AppText>
                </Pressable>
                <Button
                    title="목표로 설정"
                    variant="secondary"
                    size="sm"
                    accessibilityLabel={`${category.name} 목표로 설정`}
                    onPress={onSetGoal ? () => onSetGoal(suggestionId) : undefined}
                    className="flex-1"
                />
            </View>
        </Card>
    );
}
