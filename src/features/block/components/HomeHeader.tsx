import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText } from '@/shared/components/ui/AppText';
import { Icon, type IconName } from '@/shared/components/ui/Icon';
import { Logo } from '@/shared/components/ui/Logo';

interface HomeHeaderProps {
    /** 읽지 않은 알림이 있으면 종 아이콘에 빨간 점 */
    hasUnreadNotification?: boolean;
}

/** 홈 상단: 로고 + 빠른 입력 · 알림 · 마이 */
export function HomeHeader({ hasUnreadNotification = false }: HomeHeaderProps) {
    return (
        <View className="flex-row items-center px-5 pb-5 pt-3">
            <Pressable
                accessibilityRole="header"
                className="flex-row items-center gap-2"
                // 개발 모드에서만: 로고를 길게 누르면 공통 컴포넌트 확인 화면
                onLongPress={__DEV__ ? () => router.push('/dev/components') : undefined}
            >
                <Logo />
                <AppText className="font-bold text-17">핀트리스</AppText>
            </Pressable>
            <View className="ml-auto flex-row items-center gap-[22px]">
                {/* 빠른 입력 · 알림 · 마이 화면은 각 작업에서 연결한다. */}
                <HeaderButton icon="plus" label="빠른 입력" />
                <View>
                    <HeaderButton icon="bell" label="알림" />
                    {hasUnreadNotification && (
                        <View
                            pointerEvents="none"
                            className="absolute right-0 top-0 h-2 w-2 rounded-full bg-danger"
                        />
                    )}
                </View>
                <HeaderButton icon="user" label="마이" />
            </View>
        </View>
    );
}

interface HeaderButtonProps {
    icon: IconName;
    label: string;
    onPress?: () => void;
}

function HeaderButton({ icon, label, onPress }: HeaderButtonProps) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            hitSlop={11}
            onPress={onPress}
            className="active:opacity-60"
        >
            <Icon name={icon} size={22} />
        </Pressable>
    );
}
