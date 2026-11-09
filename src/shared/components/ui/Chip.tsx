import { Pressable } from 'react-native';

import { cn } from '@/lib/cn';
import { AppText } from '@/shared/components/ui/AppText';

interface ChipProps {
    label: string;
    isSelected?: boolean;
    disabled?: boolean;
    onPress?: () => void;
    className?: string;
}

// 선택: 청록 면 + 흰 글씨 / 기본: 회색 테두리 / 비활성: 점선 (Figma 디자인 시스템 '칩')
const STATE_CLASS = {
    selected: { container: 'border border-primary-700 bg-primary-700', text: 'text-white' },
    default: { container: 'border border-line-control bg-white active:bg-surface-chip', text: '' },
    disabled: {
        container: 'border border-dashed border-line-disabled bg-white',
        text: 'text-ink-disabled',
    },
} as const;

/** 누를 수 있는 둥근 칩 (32 · 13 SemiBold). 터치 영역은 hitSlop으로 44px을 맞춘다. */
export function Chip({
    label,
    isSelected = false,
    disabled = false,
    onPress,
    className,
}: ChipProps) {
    const state = disabled ? 'disabled' : isSelected ? 'selected' : 'default';

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected, disabled }}
            disabled={disabled}
            hitSlop={6}
            onPress={onPress}
            className={cn(
                'h-8 items-center justify-center rounded-16 px-3.5',
                STATE_CLASS[state].container,
                className,
            )}
        >
            <AppText className={cn('font-semibold text-13', STATE_CLASS[state].text)}>
                {label}
            </AppText>
        </Pressable>
    );
}
