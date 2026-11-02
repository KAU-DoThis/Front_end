import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/shared/components/ui/AppText';
import { Icon } from '@/shared/components/ui/Icon';

interface ScreenHeaderProps {
    title: string;
    /** 뒤로 가기 (기본 router.back) */
    onBack?: () => void;
    /** 오른쪽 버튼 자리 (더보기 등) */
    right?: ReactNode;
}

/** 스택 화면 상단: 뒤로 가기 + 제목 + 오른쪽 버튼 (시안 02 블록 상세) */
export function ScreenHeader({ title, onBack = router.back, right }: ScreenHeaderProps) {
    return (
        <View className="h-[60px] flex-row items-center gap-[15px] pl-[23px] pr-6">
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="뒤로 가기"
                hitSlop={11}
                onPress={onBack}
                className="active:opacity-60"
            >
                <Icon name="chevron-left" size={22} />
            </Pressable>
            <AppText numberOfLines={1} className="flex-1 font-bold text-17">
                {title}
            </AppText>
            {right}
        </View>
    );
}
