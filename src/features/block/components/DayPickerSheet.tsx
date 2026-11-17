import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import { AppText } from '@/shared/components/ui/AppText';
import { BottomSheet } from '@/shared/components/ui/BottomSheet';

const COLUMNS = 7;

interface DayPickerSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    /** 고를 수 있는 마지막 날 (납부일 31 · 기간 시작일 28 · 기한은 그달 일수) */
    maxDay: number;
    /** 이보다 앞선 날은 흐리게 막는다. (기한: 이번 달이면 오늘부터) */
    minDay?: number;
    value: number | null;
    onSelect: (day: number) => void;
}

/** 매월 며칠인지 고르는 시트. 고르면 바로 닫힌다. */
export function DayPickerSheet({
    isOpen,
    onClose,
    title,
    maxDay,
    minDay = 1,
    value,
    onSelect,
}: DayPickerSheetProps) {
    const days = Array.from({ length: maxDay }, (_, index) => index + 1);
    const rows = Array.from({ length: Math.ceil(maxDay / COLUMNS) }, (_, rowIndex) =>
        days.slice(rowIndex * COLUMNS, (rowIndex + 1) * COLUMNS),
    );

    return (
        // 블록 수정 시트 위에서도 열리므로 아래 시트를 닫지 않게 쌓는다.
        <BottomSheet isOpen={isOpen} onClose={onClose} title={title} isStacked>
            <View className="gap-2">
                {rows.map((row, rowIndex) => (
                    <View key={rowIndex} className="flex-row gap-2">
                        {Array.from({ length: COLUMNS }, (_, columnIndex) => {
                            const day = row[columnIndex];
                            if (day === undefined) {
                                return <View key={`empty-${columnIndex}`} className="flex-1" />;
                            }
                            const isSelected = day === value;
                            const isDisabled = day < minDay;
                            return (
                                <Pressable
                                    key={day}
                                    accessibilityRole="button"
                                    accessibilityLabel={`${day}일`}
                                    accessibilityState={{
                                        selected: isSelected,
                                        disabled: isDisabled,
                                    }}
                                    disabled={isDisabled}
                                    className={cn(
                                        'h-11 flex-1 items-center justify-center rounded-12',
                                        isSelected
                                            ? 'bg-primary-700'
                                            : 'bg-surface-app active:bg-surface-chip',
                                    )}
                                    onPress={() => {
                                        onSelect(day);
                                        onClose();
                                    }}
                                >
                                    <AppText
                                        className={cn(
                                            'text-15',
                                            isSelected && 'font-bold text-white',
                                            isDisabled && 'text-ink-disabled',
                                        )}
                                    >
                                        {day}
                                    </AppText>
                                </Pressable>
                            );
                        })}
                    </View>
                ))}
            </View>
        </BottomSheet>
    );
}
