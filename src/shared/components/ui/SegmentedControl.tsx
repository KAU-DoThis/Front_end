import { Pressable, StyleSheet, View } from 'react-native';

import { cn } from '@/lib/cn';
import { AppText } from '@/shared/components/ui/AppText';
import { colors } from '@/styles/tokens';

export interface SegmentedOption<T extends string> {
    value: T;
    label: string;
    /** 이름 뒤에 붙는 숫자 (예: 은행 2). 0이면 숨긴다. */
    count?: number;
}

interface SegmentedControlProps<T extends string> {
    options: SegmentedOption<T>[];
    value: T;
    onChange: (value: T) => void;
    /** lg: 탭 전환 (48 · 15, 시안 00-4) / md: 값 고르기 (44 · 13, 시안 04 블록 유형) */
    size?: 'lg' | 'md';
    disabled?: boolean;
    className?: string;
}

const SIZE_STYLE = {
    lg: {
        container: 'h-12 rounded-12 bg-surface-neutral',
        item: 'rounded-8',
        text: 'text-15',
        selectedText: 'font-bold text-ink',
        defaultText: 'text-ink-sub',
    },
    md: {
        container: 'h-11 rounded-12 bg-line-soft',
        item: 'rounded-12',
        text: 'text-13',
        selectedText: 'text-primary-700',
        defaultText: 'text-ink',
    },
} as const;

/** 회색 바탕 위에서 고른 칸만 흰 면으로 떠 있는 세그먼트 버튼 */
export function SegmentedControl<T extends string>({
    options,
    value,
    onChange,
    size = 'lg',
    disabled = false,
    className,
}: SegmentedControlProps<T>) {
    const style = SIZE_STYLE[size];

    return (
        <View
            accessibilityRole="tablist"
            className={cn('flex-row p-1', style.container, disabled && 'opacity-40', className)}
        >
            {options.map((option) => {
                const isSelected = option.value === value;
                const hasCount = option.count !== undefined && option.count > 0;

                return (
                    <Pressable
                        key={option.value}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: isSelected, disabled }}
                        accessibilityLabel={
                            hasCount ? `${option.label} ${option.count}곳 선택` : option.label
                        }
                        disabled={disabled}
                        className={cn(
                            'flex-1 items-center justify-center',
                            style.item,
                            isSelected && 'bg-white',
                        )}
                        style={isSelected ? styles.selected : undefined}
                        onPress={() => onChange(option.value)}
                    >
                        <AppText
                            className={cn(
                                style.text,
                                isSelected ? style.selectedText : style.defaultText,
                            )}
                        >
                            {option.label}
                            {hasCount && (
                                <AppText
                                    className={cn(
                                        style.text,
                                        isSelected
                                            ? 'font-bold text-primary-700'
                                            : style.defaultText,
                                    )}
                                >
                                    {` ${option.count}`}
                                </AppText>
                            )}
                        </AppText>
                    </Pressable>
                );
            })}
        </View>
    );
}

// 고른 칸의 옅은 그림자 (0 1 1.5 · primary-900 10%). className으로 그림자 색을 줄 수 없어 style로 둔다.
const styles = StyleSheet.create({
    selected: {
        shadowColor: colors.primary[900],
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1.5,
        elevation: 1,
    },
});
