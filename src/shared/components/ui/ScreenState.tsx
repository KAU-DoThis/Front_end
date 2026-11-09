import { ActivityIndicator, View } from 'react-native';

import { cn } from '@/lib/cn';
import { AppText } from '@/shared/components/ui/AppText';
import { Button } from '@/shared/components/ui/Button';
import { colors } from '@/styles/tokens';

type ScreenStateVariant = 'loading' | 'error' | 'empty';

interface ScreenStateProps {
    variant: ScreenStateVariant;
    title: string;
    description?: string;
    /** 할 일 버튼 (예: 다시 시도, 계좌 연동하기) */
    actionTitle?: string;
    onPressAction?: () => void;
    className?: string;
}

function StateMark({ variant }: { variant: ScreenStateVariant }) {
    if (variant === 'loading') {
        return <ActivityIndicator size="large" color={colors.primary[700]} />;
    }
    if (variant === 'error') {
        return (
            <View className="h-8 w-8 items-center justify-center rounded-full border-2 border-danger-text">
                <AppText className="font-bold text-17 text-danger-text">!</AppText>
            </View>
        );
    }
    // 비어 있음: 겹친 블록 두 개
    return (
        <View className="flex-row items-end gap-1">
            <View className="h-8 w-6 rounded-8 border border-primary-100 bg-primary-50" />
            <View className="h-5 w-5 rounded-8 border border-primary-100 bg-primary-50" />
        </View>
    );
}

/**
 * 화면 상태 (Figma 디자인 시스템 '화면 상태')
 * 비어 있으면 할 일을, 오류면 무엇이 왜 안 됐고 어떻게 하면 되는지 알려준다.
 */
export function ScreenState({
    variant,
    title,
    description,
    actionTitle,
    onPressAction,
    className,
}: ScreenStateProps) {
    return (
        <View
            className={cn('flex-1 items-center justify-center px-5', className)}
            accessibilityLiveRegion="polite"
        >
            <StateMark variant={variant} />
            <AppText className="mt-4 text-center font-bold text-17">{title}</AppText>
            {description && (
                <AppText className="mt-2 text-center text-13 text-ink-sub">{description}</AppText>
            )}
            {actionTitle && onPressAction && (
                <Button title={actionTitle} onPress={onPressAction} className="mt-6 w-full" />
            )}
        </View>
    );
}
