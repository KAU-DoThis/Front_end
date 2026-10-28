import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';

interface ToggleProps {
    value: boolean;
    onValueChange: (value: boolean) => void;
    /** 스크린리더용 이름 (옆 문구와 같게) */
    accessibilityLabel: string;
    disabled?: boolean;
}

/** 켜기·끄기 스위치 (48×28, 시안 02-2 알림). 켜짐: 청록 면 + 흰 손잡이, 꺼짐: 회색 테두리 + 회색 손잡이 */
export function Toggle({ value, onValueChange, accessibilityLabel, disabled }: ToggleProps) {
    return (
        <Pressable
            accessibilityRole="switch"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={{ checked: value, disabled }}
            disabled={disabled}
            hitSlop={8}
            onPress={() => onValueChange(!value)}
            className={cn(
                'h-7 w-12 justify-center rounded-12 px-[1.5px]',
                value ? 'bg-primary-700' : 'border-1.5 border-line-control bg-white',
                disabled && 'opacity-40',
            )}
        >
            <View
                className={cn(
                    'h-[22px] w-[22px] rounded-full',
                    value ? 'ml-auto mr-[1.5px] bg-white' : 'bg-line-control',
                )}
            />
        </Pressable>
    );
}
