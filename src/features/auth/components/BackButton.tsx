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
            // 딥링크로 바로 들어와 이전 화면이 없으면 로그인으로 보낸다.
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))}
        >
            <Image source={BACK_ICON} className="h-5.5 w-5.5" />
        </Pressable>
    );
}
