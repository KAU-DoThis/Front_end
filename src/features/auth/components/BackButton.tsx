import { router } from 'expo-router';
import { Image, Pressable } from 'react-native';

import { cn } from '@/lib/cn';

const BACK_ICON = require('@/assets/icons/auth-back.png');

interface BackButtonProps {
    /** 요청 중처럼 화면을 떠나면 안 될 때 막는다. */
    disabled?: boolean;
}

/** 왼쪽 위 뒤로 가기 (22px 아이콘 · 터치 영역 44) */
export function BackButton({ disabled = false }: BackButtonProps) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel="뒤로 가기"
            accessibilityState={{ disabled }}
            disabled={disabled}
            className={cn('h-11 w-11 items-center justify-center', disabled && 'opacity-40')}
            // 딥링크로 바로 들어와 이전 화면이 없으면 로그인으로 보낸다.
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))}
        >
            <Image source={BACK_ICON} className="h-5.5 w-5.5" />
        </Pressable>
    );
}
