import { router } from 'expo-router';
import { Image, Pressable } from 'react-native';

const BACK_ICON = require('@/assets/icons/auth-back.png');

/** 왼쪽 위 뒤로 가기 (22px 아이콘 · 터치 영역 44) */
export function BackButton() {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel="뒤로 가기"
            className="h-11 w-11 items-center justify-center"
            onPress={() => router.back()}
        >
            <Image source={BACK_ICON} className="h-5.5 w-5.5" />
        </Pressable>
    );
}
