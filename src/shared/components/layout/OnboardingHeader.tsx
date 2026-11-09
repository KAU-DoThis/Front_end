import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import { AppText } from '@/shared/components/ui/AppText';
import { Icon } from '@/shared/components/ui/Icon';

interface OnboardingHeaderProps {
    /** 지금 단계 (1부터) */
    step: number;
    totalSteps: number;
    onClose: () => void;
    /** 요청 중처럼 화면을 떠나면 안 될 때 막는다. */
    isCloseDisabled?: boolean;
}

/** 온보딩 위쪽 줄: 단계 막대 + "1 / 3" + 닫기 (시안 00-4 · 04) */
export function OnboardingHeader({
    step,
    totalSteps,
    onClose,
    isCloseDisabled = false,
}: OnboardingHeaderProps) {
    return (
        <View className="h-11 flex-row items-center px-5">
            <View
                className="flex-row gap-1"
                accessible
                accessibilityLabel={`${totalSteps}단계 중 ${step}단계`}
            >
                {Array.from({ length: totalSteps }, (_, index) => (
                    <View
                        key={index}
                        className={cn(
                            'h-1 w-5 rounded-full',
                            index < step ? 'bg-primary-600' : 'bg-line',
                        )}
                    />
                ))}
            </View>
            <AppText className="ml-3 text-12 text-ink-sub" importantForAccessibility="no">
                {`${step} / ${totalSteps}`}
            </AppText>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="닫기"
                accessibilityState={{ disabled: isCloseDisabled }}
                disabled={isCloseDisabled}
                className={cn('ml-auto active:opacity-60', isCloseDisabled && 'opacity-40')}
                // 20px 아이콘의 터치 영역을 44px로 맞춘다.
                hitSlop={12}
                onPress={onClose}
            >
                <Icon name="close" size={20} />
            </Pressable>
        </View>
    );
}
