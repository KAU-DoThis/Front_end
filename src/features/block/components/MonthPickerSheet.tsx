import { Pressable, ScrollView, View } from 'react-native';

import { cn } from '@/lib/cn';
import { AppText } from '@/shared/components/ui/AppText';
import { BottomSheet } from '@/shared/components/ui/BottomSheet';

/** 이번 달부터 고를 수 있는 달 수 (3년) */
const MONTH_COUNT = 36;
const COLUMNS = 3;

const pad = (value: number) => String(value).padStart(2, '0');

/** 그달 말일 (yyyy-MM-dd) */
export function toMonthEndDate(year: number, month: number) {
    const lastDay = new Date(year, month, 0).getDate();
    return `${year}-${pad(month)}-${pad(lastDay)}`;
}

/** "2027-02-28" → "2027년 2월" */
export function formatYearMonth(date: string) {
    const [year, month] = date.slice(0, 7).split('-').map(Number);
    return `${year}년 ${month}월`;
}

interface MonthPickerSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    /** 고른 기한 (그달 말일, yyyy-MM-dd) */
    value: string | null;
    /** 고른 달의 말일을 넘긴다. */
    onSelect: (monthEndDate: string) => void;
}

/** 이번 달부터 3년 안에서 달을 고르는 시트. 고른 달의 말일이 기한이 된다. 고르면 바로 닫힌다. */
export function MonthPickerSheet({
    isOpen,
    onClose,
    title,
    value,
    onSelect,
}: MonthPickerSheetProps) {
    const today = new Date();
    const months = Array.from({ length: MONTH_COUNT }, (_, index) => {
        const date = new Date(today.getFullYear(), today.getMonth() + index, 1);
        return { year: date.getFullYear(), month: date.getMonth() + 1 };
    });
    const years = [...new Set(months.map(({ year }) => year))];
    const selected = value?.slice(0, 7) ?? null;

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
            <ScrollView className="max-h-96" contentContainerClassName="gap-4">
                {years.map((year) => {
                    const yearMonths = months.filter((item) => item.year === year);
                    const rows = Array.from(
                        { length: Math.ceil(yearMonths.length / COLUMNS) },
                        (_, rowIndex) =>
                            yearMonths.slice(rowIndex * COLUMNS, (rowIndex + 1) * COLUMNS),
                    );
                    return (
                        <View key={year} className="gap-2">
                            <AppText className="font-semibold text-13 text-ink-sub">{`${year}년`}</AppText>
                            {rows.map((row, rowIndex) => (
                                <View key={rowIndex} className="flex-row gap-2">
                                    {Array.from({ length: COLUMNS }, (_, columnIndex) => {
                                        const item = row[columnIndex];
                                        if (!item) {
                                            return (
                                                <View
                                                    key={`empty-${columnIndex}`}
                                                    className="flex-1"
                                                />
                                            );
                                        }
                                        const isSelected =
                                            selected === `${item.year}-${pad(item.month)}`;
                                        return (
                                            <Pressable
                                                key={item.month}
                                                accessibilityRole="button"
                                                accessibilityLabel={`${item.year}년 ${item.month}월`}
                                                accessibilityState={{ selected: isSelected }}
                                                className={cn(
                                                    'h-11 flex-1 items-center justify-center rounded-12',
                                                    isSelected
                                                        ? 'bg-primary-700'
                                                        : 'bg-surface-app active:bg-surface-chip',
                                                )}
                                                onPress={() => {
                                                    onSelect(toMonthEndDate(item.year, item.month));
                                                    onClose();
                                                }}
                                            >
                                                <AppText
                                                    className={cn(
                                                        'text-15',
                                                        isSelected && 'font-bold text-white',
                                                    )}
                                                >
                                                    {`${item.month}월`}
                                                </AppText>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            ))}
                        </View>
                    );
                })}
            </ScrollView>
        </BottomSheet>
    );
}
