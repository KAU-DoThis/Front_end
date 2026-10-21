import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native';

import { cn } from '@/lib/cn';
import { AppText } from '@/shared/components/ui/AppText';
import { colors } from '@/styles/tokens';

type ButtonVariant = 'primary' | 'secondary';
type ButtonSize = 'lg' | 'md' | 'sm';

interface ButtonProps extends Omit<PressableProps, 'children'> {
    title: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    /** 로딩 중에 보여줄 문구 (없으면 title 그대로) */
    loadingTitle?: string;
    className?: string;
}

// L 54·14·16 Bold / M 44·12·15 SemiBold / S 40·12·13 SemiBold
const SIZE_CLASS = {
    lg: { container: 'h-13.5 rounded-14 px-5', text: 'text-16 font-bold' },
    md: { container: 'h-11 rounded-12 px-4', text: 'text-15 font-semibold' },
    sm: { container: 'h-10 rounded-12 px-4', text: 'text-13 font-semibold' },
} as const;

// 눌림은 크기 그대로 한 단계 진하게, 비활성은 회색 면(보조는 점선 테두리)
const VARIANT_CLASS = {
    primary: {
        enabled: { container: 'bg-primary-700 active:bg-primary-800', text: 'text-white' },
        disabled: { container: 'bg-surface-disabled', text: 'text-line-control' },
    },
    secondary: {
        enabled: {
            container: 'border border-line-control bg-white active:bg-surface-chip',
            text: 'text-ink',
        },
        disabled: {
            container: 'border border-dashed border-line-disabled bg-white',
            text: 'text-ink-disabled',
        },
    },
} as const;

const SPINNER_COLOR = { primary: colors.white, secondary: colors.ink.DEFAULT } as const;

// 40px 버튼은 터치 영역을 44px로 맞춘다.
const HIT_SLOP = { lg: undefined, md: undefined, sm: 2 } as const;

export function Button({
    title,
    variant = 'primary',
    size = 'lg',
    isLoading = false,
    loadingTitle,
    disabled,
    className,
    ...props
}: ButtonProps) {
    // 로딩 중에는 누를 수 없지만 비활성 색으로 바꾸지 않는다.
    const isDisabled = !!disabled && !isLoading;
    const sizeClass = SIZE_CLASS[size];
    const variantClass = VARIANT_CLASS[variant][isDisabled ? 'disabled' : 'enabled'];

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: isDisabled || isLoading, busy: isLoading }}
            className={cn(
                'items-center justify-center',
                sizeClass.container,
                variantClass.container,
                className,
            )}
            disabled={isDisabled || isLoading}
            hitSlop={HIT_SLOP[size]}
            {...props}
        >
            <View className="flex-row items-center gap-2">
                {isLoading && <ActivityIndicator size="small" color={SPINNER_COLOR[variant]} />}
                <AppText className={cn(sizeClass.text, variantClass.text)}>
                    {isLoading ? (loadingTitle ?? title) : title}
                </AppText>
            </View>
        </Pressable>
    );
}
