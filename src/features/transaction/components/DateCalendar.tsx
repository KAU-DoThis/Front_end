import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import { AppText } from '@/shared/components/ui/AppText';
import { Icon } from '@/shared/components/ui/Icon';
import { colors } from '@/styles/tokens';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const pad = (value: number) => String(value).padStart(2, '0');

/** yyyy-MM에서 달을 더하거나 뺀다. */
function shiftMonth(month: string, diff: number) {
    const [year, monthNumber] = month.split('-').map(Number);
    const date = new Date(Date.UTC(year, monthNumber - 1 + diff, 1));
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
}

/** 달력 한 달을 주 단위로 나눈다. 앞뒤 빈칸은 null (yyyy-MM-dd 목록) */
function toWeeks(month: string) {
    const [year, monthNumber] = month.split('-').map(Number);
    const firstWeekday = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
    const dayCount = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    const cells: (string | null)[] = [
        ...Array.from({ length: firstWeekday }, () => null),
        ...Array.from({ length: dayCount }, (_, index) => `${month}-${pad(index + 1)}`),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    return Array.from({ length: cells.length / 7 }, (_, week) =>
        cells.slice(week * 7, week * 7 + 7),
    );
}

interface DateCalendarProps {
    /** 고른 날 (yyyy-MM-dd) */
    value: string;
    /** 서버 기준 오늘 (yyyy-MM-dd) — 오늘보다 뒤는 고를 수 없다. */
    today: string;
    onSelect: (date: string) => void;
}

/** 날짜 고르기 달력. 날짜를 누르면 바로 고른다. 날짜 문자열끼리만 비교해 시간대 영향을 받지 않는다. */
export function DateCalendar({ value, today, onSelect }: DateCalendarProps) {
    const [month, setMonth] = useState(value.slice(0, 7));
    const [year, monthNumber] = month.split('-').map(Number);
    const canGoNext = month < today.slice(0, 7);

    return (
        <View className="pb-2">
            <View className="flex-row items-center justify-between pb-3">
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="이전 달"
                    hitSlop={12}
                    onPress={() => setMonth(shiftMonth(month, -1))}
                    className="h-8 w-8 items-center justify-center active:opacity-60"
                >
                    <Icon name="chevron-left" size={20} />
                </Pressable>
                <AppText className="font-bold text-16">{`${year}년 ${monthNumber}월`}</AppText>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="다음 달"
                    accessibilityState={{ disabled: !canGoNext }}
                    disabled={!canGoNext}
                    hitSlop={12}
                    onPress={() => setMonth(shiftMonth(month, 1))}
                    className="h-8 w-8 items-center justify-center active:opacity-60"
                >
                    <Icon
                        name="chevron-right"
                        size={20}
                        color={canGoNext ? colors.ink.DEFAULT : colors.ink.disabled}
                    />
                </Pressable>
            </View>

            <View className="flex-row">
                {WEEKDAYS.map((weekday) => (
                    <AppText key={weekday} className="flex-1 pb-1 text-center text-12 text-ink-sub">
                        {weekday}
                    </AppText>
                ))}
            </View>

            {toWeeks(month).map((week) => (
                <View key={week.find(Boolean)} className="flex-row">
                    {week.map((date, index) => {
                        if (!date) {
                            return <View key={`empty-${index}`} className="h-11 flex-1" />;
                        }
                        const isSelected = date === value;
                        const isToday = date === today;
                        const isFuture = date > today;
                        const day = Number(date.slice(8));
                        return (
                            <Pressable
                                key={date}
                                accessibilityRole="button"
                                accessibilityLabel={`${monthNumber}월 ${day}일${isToday ? ' 오늘' : ''}`}
                                accessibilityState={{ selected: isSelected, disabled: isFuture }}
                                disabled={isFuture}
                                onPress={() => onSelect(date)}
                                className="h-11 flex-1 items-center justify-center"
                            >
                                <View
                                    className={cn(
                                        'h-10 w-10 items-center justify-center rounded-full',
                                        isSelected
                                            ? 'bg-primary-700'
                                            : isToday && 'border border-primary-100',
                                    )}
                                >
                                    <AppText
                                        className={cn(
                                            'text-15',
                                            isSelected && 'font-bold text-white',
                                            !isSelected && isToday && 'font-bold text-primary-700',
                                            isFuture && 'text-ink-disabled',
                                        )}
                                    >
                                        {day}
                                    </AppText>
                                </View>
                            </Pressable>
                        );
                    })}
                </View>
            ))}
        </View>
    );
}
