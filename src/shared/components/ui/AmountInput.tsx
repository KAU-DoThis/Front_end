import { useState, type ReactNode } from 'react';
import { TextInput, View } from 'react-native';

import { cn } from '@/lib/cn';
import { AppText } from '@/shared/components/ui/AppText';
import { colors } from '@/styles/tokens';

/** 1조 원 아래까지만 받는다. (숫자 13자리) */
const MAX_DIGITS = 13;

interface AmountInputProps {
    /** 원 단위 정수. 비어 있으면 null */
    value: number | null;
    onChangeValue: (value: number | null) => void;
    /** 칸 위 작은 라벨 (예: 한 달 금액) */
    label?: string;
    /** 있으면 오류 상태로 바꾸고 칸 바로 아래에 보여준다. */
    errorMessage?: string;
    /** 오류가 없을 때 칸 아래에 보여줄 안내 */
    helperText?: string;
    disabled?: boolean;
    /** 칸 양옆에 붙일 요소 (예: − / + 버튼) */
    leading?: ReactNode;
    trailing?: ReactNode;
    /** md: 한 줄을 다 쓰는 칸 (17 Bold) / sm: 반 폭 칸 (15 SemiBold, 시안 04 납부 금액) */
    size?: 'md' | 'sm';
    className?: string;
}

const SIZE_CLASS = {
    md: { value: 'font-bold text-17', unit: 'text-15' },
    sm: { value: 'font-semibold text-15', unit: 'text-13' },
} as const;

// 기본 1px / 입력 중·오류 2px / 비활성 점선 (Figma 디자인 시스템 '입력칸')
const FIELD_STATE_CLASS = {
    default: 'border border-line-control bg-white',
    focused: 'border-2 border-primary-700 bg-white',
    error: 'border-2 border-danger-text bg-white',
    disabled: 'border border-dashed border-line-disabled bg-surface-input-disabled',
} as const;

const toDisplay = (value: number | null) => (value === null ? '' : value.toLocaleString('ko-KR'));

/** 금액 입력칸 (44 · 12). 오른쪽 정렬 굵은 숫자 + "원", 천 단위 쉼표는 입력하면서 붙인다. */
export function AmountInput({
    value,
    onChangeValue,
    label,
    errorMessage,
    helperText,
    disabled = false,
    leading,
    trailing,
    size = 'md',
    className,
}: AmountInputProps) {
    const [isFocused, setIsFocused] = useState(false);

    const fieldState = disabled
        ? 'disabled'
        : errorMessage
          ? 'error'
          : isFocused
            ? 'focused'
            : 'default';
    const message = errorMessage ?? helperText;
    const textColor = disabled ? 'text-ink-disabled' : 'text-ink';

    const handleChangeText = (text: string) => {
        const digits = text.replace(/\D/g, '').slice(0, MAX_DIGITS);
        onChangeValue(digits === '' ? null : Number(digits));
    };

    return (
        <View className={cn('gap-2', className)}>
            {label && <AppText className="text-12 text-ink-sub">{label}</AppText>}
            <View className="flex-row gap-2">
                {leading}
                <View
                    className={cn(
                        'h-11 flex-1 flex-row items-center rounded-12 px-3',
                        FIELD_STATE_CLASS[fieldState],
                    )}
                >
                    <TextInput
                        // Android TextInput 기본 위아래 여백 때문에 44px 칸에서 숫자가 잘리지 않도록 여백을 없앤다.
                        className={cn(
                            'h-full min-w-0 flex-1 py-0 text-right',
                            SIZE_CLASS[size].value,
                            textColor,
                        )}
                        style={{ includeFontPadding: false, textAlignVertical: 'center' }}
                        value={toDisplay(value)}
                        onChangeText={handleChangeText}
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor={colors.ink.disabled}
                        editable={!disabled}
                        accessibilityLabel={label ? `${label} (원)` : '금액 (원)'}
                        accessibilityState={{ disabled }}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                    />
                    <AppText className={cn('ml-1', SIZE_CLASS[size].unit, textColor)}>원</AppText>
                </View>
                {trailing}
            </View>
            {message && (
                <AppText
                    className={cn('text-12', errorMessage ? 'text-danger-text' : 'text-ink-sub')}
                    accessibilityLiveRegion={errorMessage ? 'polite' : undefined}
                >
                    {message}
                </AppText>
            )}
        </View>
    );
}
