import { Pressable, Text, type PressableProps } from 'react-native';

import { cn } from '@/lib/cn';

interface ButtonProps extends PressableProps {
    title: string;
    variant?: 'primary' | 'outline';
    className?: string;
}

export function Button({ title, variant = 'primary', className, disabled, ...props }: ButtonProps) {
    return (
        <Pressable
            className={cn(
                'h-12 items-center justify-center rounded-xl px-4 active:opacity-80',
                variant === 'primary' && 'bg-primary-600',
                variant === 'outline' && 'border border-primary-600 bg-white',
                disabled && 'opacity-40',
                className,
            )}
            disabled={disabled}
            {...props}
        >
            <Text
                className={cn(
                    'text-base font-semibold',
                    variant === 'primary' ? 'text-white' : 'text-primary-600',
                )}
            >
                {title}
            </Text>
        </Pressable>
    );
}
