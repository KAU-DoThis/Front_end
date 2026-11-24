import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

/**
 * 기기의 '동작 줄이기' 설정. 앱을 켜둔 채 설정을 바꿔도 바로 반영된다.
 * (reanimated의 useReducedMotion은 앱 시작 때 읽은 값만 돌려줘서, 처음 값으로만 쓴다)
 */
export function useReduceMotion() {
    const initial = useReducedMotion();
    const [isReduceMotion, setIsReduceMotion] = useState(initial);

    useEffect(() => {
        let isMounted = true;
        AccessibilityInfo.isReduceMotionEnabled()
            .then((enabled) => {
                if (isMounted) setIsReduceMotion(enabled);
            })
            .catch(() => {});
        const subscription = AccessibilityInfo.addEventListener(
            'reduceMotionChanged',
            setIsReduceMotion,
        );
        return () => {
            isMounted = false;
            subscription.remove();
        };
    }, []);

    return isReduceMotion;
}
