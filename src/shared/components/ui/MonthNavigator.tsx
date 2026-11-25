import { Pressable, View } from 'react-native';

import { AppText } from '@/shared/components/ui/AppText';
import { Icon } from '@/shared/components/ui/Icon';
import { colors } from '@/styles/tokens';

interface MonthNavigatorProps {
    /** yyyy-MM */
    month: string;
    /** 이번 달이면 다음 달로 넘길 수 없다. */
    canGoNext: boolean;
    onChange: (month: string) => void;
    /** 오른쪽 보조 문구 (예: 1일 ~ 14일 · 9월 같은 기간과 비교) */
    caption?: string;
    /** 가운데 글자 (기본: 10월). 리포트는 '9월 리포트'처럼 바꿔 쓴다. */
    label?: string;
}

/** yyyy-MM에서 달을 더하거나 뺀다. */
function shiftMonth(month: string, diff: number) {
    const [year, monthNumber] = month.split('-').map(Number);
    const date = new Date(Date.UTC(year, monthNumber - 1 + diff, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** ‹ 10월 › + 오른쪽 기간 문구 */
export function MonthNavigator({
    month,
    canGoNext,
    onChange,
    caption,
    label,
}: MonthNavigatorProps) {
    const monthNumber = Number(month.slice(5, 7));

    return (
        <View className="flex-row items-center pl-4 pr-5">
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="이전 달"
                hitSlop={14}
                onPress={() => onChange(shiftMonth(month, -1))}
                className="active:opacity-60"
            >
                <Icon name="chevron-left" size={16} color={colors.ink.sub} strokeWidth={1.47} />
            </Pressable>
            <AppText className="ml-2 mr-[11px] font-bold text-17">
                {label ?? `${monthNumber}월`}
            </AppText>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="다음 달"
                accessibilityState={{ disabled: !canGoNext }}
                disabled={!canGoNext}
                hitSlop={14}
                onPress={() => onChange(shiftMonth(month, 1))}
                className="active:opacity-60"
            >
                <Icon
                    name="chevron-right"
                    size={16}
                    color={canGoNext ? colors.ink.sub : colors.ink.disabled}
                    strokeWidth={1.47}
                />
            </Pressable>
            {caption && <AppText className="ml-auto text-12 text-ink-sub">{caption}</AppText>}
        </View>
    );
}
