import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PRESS_TIMING = { duration: 120, easing: Easing.out(Easing.quad) } as const;

interface PressableScaleProps extends Omit<PressableProps, 'children' | 'style'> {
    children: ReactNode;
    className?: string;
    /** 크기 애니메이션 스타일 앞에 합친다. (누름 상태 함수형 스타일은 받지 않는다) */
    style?: StyleProp<ViewStyle>;
}

/** 누르면 0.97로 살짝 줄어드는 버튼 (120ms). 동작 줄이기 설정이면 크기를 바꾸지 않는다. */
export function PressableScale({
    children,
    style,
    onPressIn,
    onPressOut,
    ...props
}: PressableScaleProps) {
    const isReducedMotion = useReducedMotion();
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

    return (
        <AnimatedPressable
            accessibilityRole="button"
            {...props}
            style={[style, animatedStyle]}
            onPressIn={(event) => {
                if (!isReducedMotion) {
                    scale.set(withTiming(0.97, PRESS_TIMING));
                }
                onPressIn?.(event);
            }}
            onPressOut={(event) => {
                scale.set(withTiming(1, PRESS_TIMING));
                onPressOut?.(event);
            }}
        >
            {children}
        </AnimatedPressable>
    );
}
