import { useState } from 'react';
import { Image, Pressable, TextInput, View, type TextInputProps } from 'react-native';

import { cn } from '@/lib/cn';
import { AppText } from '@/shared/components/ui/AppText';
import { colors } from '@/styles/tokens';

const EYE_ICON = require('@/assets/icons/input-eye.png');

interface InputProps extends Omit<TextInputProps, 'editable'> {
    label?: string;
    /** 있으면 오류 상태로 바꾸고 칸 바로 아래에 보여준다. */
    errorMessage?: string;
    /** 오류가 없을 때 칸 아래에 보여줄 안내 (예: 사용할 수 있는 비밀번호에요) */
    helperText?: string;
    disabled?: boolean;
    className?: string;
}

// 기본 1px 테두리 / 입력 중·오류 2px / 비활성 점선 (Figma 디자인 시스템 '입력칸')
const FIELD_STATE_CLASS = {
    default: 'border border-line-control bg-surface-app',
    focused: 'border-2 border-primary-700 bg-surface-app',
    error: 'border-2 border-danger-text bg-surface-app',
    disabled: 'border border-dashed border-line-disabled bg-surface-input-disabled',
} as const;

/**
 * 라벨이 붙은 한 줄 입력칸 (56 · 12 · 16 Regular)
 * secureTextEntry를 주면 오른쪽에 비밀번호 보기 버튼이 생긴다.
 */
export function Input({
    label,
    errorMessage,
    helperText,
    disabled = false,
    secureTextEntry,
    className,
    onFocus,
    onBlur,
    ...props
}: InputProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [isSecretVisible, setIsSecretVisible] = useState(false);

    const fieldState = disabled
        ? 'disabled'
        : errorMessage
          ? 'error'
          : isFocused
            ? 'focused'
            : 'default';
    const message = errorMessage ?? helperText;

    return (
        <View className={cn('gap-2.5', className)}>
            {label && <AppText className="font-bold text-16">{label}</AppText>}
            <View
                className={cn(
                    'h-14 flex-row items-center rounded-12 px-5',
                    FIELD_STATE_CLASS[fieldState],
                )}
            >
                <TextInput
                    className={cn(
                        'h-full flex-1 font-regular text-16',
                        disabled ? 'text-line-control' : 'text-ink',
                    )}
                    placeholderTextColor={colors.ink.disabled}
                    editable={!disabled}
                    secureTextEntry={secureTextEntry && !isSecretVisible}
                    accessibilityLabel={label}
                    accessibilityState={{ disabled }}
                    onFocus={(event) => {
                        setIsFocused(true);
                        onFocus?.(event);
                    }}
                    onBlur={(event) => {
                        setIsFocused(false);
                        onBlur?.(event);
                    }}
                    {...props}
                />
                {secureTextEntry && (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={isSecretVisible ? '비밀번호 숨기기' : '비밀번호 보기'}
                        className="ml-2.5"
                        disabled={disabled}
                        // 24px 아이콘의 터치 영역을 44px로 맞춘다.
                        hitSlop={10}
                        onPress={() => setIsSecretVisible((prev) => !prev)}
                    >
                        <Image
                            source={EYE_ICON}
                            className="h-6 w-6"
                            style={{
                                tintColor: isSecretVisible ? colors.primary[700] : colors.ink.sub,
                            }}
                        />
                    </Pressable>
                )}
            </View>
            {message && (
                <AppText
                    className={cn(
                        'text-12',
                        errorMessage ? 'text-danger-text' : 'font-bold text-primary-700',
                    )}
                    accessibilityLiveRegion={errorMessage ? 'polite' : undefined}
                >
                    {message}
                </AppText>
            )}
        </View>
    );
}
