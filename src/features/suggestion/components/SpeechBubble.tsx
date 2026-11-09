import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { withAlpha } from '@/lib/color';
import { AppText } from '@/shared/components/ui/AppText';
import { colors } from '@/styles/tokens';

/** 방 그림 위에 뜨는 카드 그림자 (시안 0 4 14 primary-900 22%) */
const BUBBLE_SHADOW = `0px 4px 14px 0px ${withAlpha(colors.primary[900], 0.22)}`;

interface SpeechBubbleProps {
    message: string;
    /** 꼬리 가운데의 왼쪽 거리 (px) */
    tailLeft: number;
    className?: string;
    style?: StyleProp<ViewStyle>;
}

/** 초불이 말풍선 (아래쪽 꼬리). 나타날 때 200ms 동안 흐릿한 상태에서 또렷해진다. */
export function SpeechBubble({ message, tailLeft, className, style }: SpeechBubbleProps) {
    return (
        <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            className={className}
            style={style}
            accessibilityLiveRegion="polite"
        >
            <View className="rounded-16 bg-white px-4 py-3" style={{ boxShadow: BUBBLE_SHADOW }}>
                <AppText className="font-semibold text-15 leading-[22px]">{message}</AppText>
            </View>
            {/* 꼬리: 45도 돌린 정사각형의 아래 반쪽 */}
            <View
                className="absolute -bottom-2 h-4 w-4 rotate-45 bg-white"
                style={{ left: tailLeft - 8 }}
            />
        </Animated.View>
    );
}
