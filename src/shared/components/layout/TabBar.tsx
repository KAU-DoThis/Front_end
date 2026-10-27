import { router, type Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Image, Pressable, View, type ImageSourcePropType } from 'react-native';

import { cn } from '@/lib/cn';
import { AppText } from '@/shared/components/ui/AppText';
import { colors } from '@/styles/tokens';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

interface CustomTabBarProps extends TabBarProps {
    /** 에이전트 버튼 위 배지 숫자 (0이면 숨김) */
    agentBadgeCount?: number;
}

// 라우트 이름 → 탭 표시 정보 (순서는 (tabs)/_layout.tsx의 Tabs.Screen 순서를 따른다)
const TAB_ITEMS: Record<string, { label: string; icon: ImageSourcePropType }> = {
    index: { label: '블록', icon: require('@/assets/icons/tab-block.png') },
    transactions: { label: '내역', icon: require('@/assets/icons/tab-transactions.png') },
    saving: { label: '절약', icon: require('@/assets/icons/tab-saving.png') },
    report: { label: '리포트', icon: require('@/assets/icons/tab-report.png') },
};

// 에이전트 버튼은 블록·내역 다음(가운데)에 들어간다.
const AGENT_SLOT_INDEX = 2;

/**
 * 하단 탭 바 (시안 Navigator: 높이 68 + 아래 여백, 가운데 에이전트 버튼은 위로 26 솟음)
 * 에이전트는 탭이 아니라 전체 화면(/agent)으로 열리고 뒤로 가기로 돌아온다.
 */
export function TabBar({ state, navigation, insets, agentBadgeCount = 0 }: CustomTabBarProps) {
    const tabs = state.routes.map((route, index) => {
        const item = TAB_ITEMS[route.name];
        if (!item) {
            return null;
        }
        const isFocused = state.index === index;

        const handlePress = () => {
            const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
            }
        };

        return (
            <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: isFocused }}
                accessibilityLabel={item.label}
                className="h-17 flex-1 items-center justify-center gap-1 active:opacity-60"
                onPress={handlePress}
            >
                <Image
                    source={item.icon}
                    className="h-6 w-6"
                    style={{ tintColor: isFocused ? colors.primary[700] : colors.ink.sub }}
                />
                <AppText
                    className={cn(
                        'text-12',
                        isFocused ? 'font-semibold text-primary-700' : 'text-ink-sub',
                    )}
                >
                    {item.label}
                </AppText>
            </Pressable>
        );
    });

    tabs.splice(AGENT_SLOT_INDEX, 0, <AgentButton key="agent" badgeCount={agentBadgeCount} />);

    return (
        <View
            className="flex-row border-t border-line bg-white"
            // 제스처 내비게이션 영역만큼 아래 여백을 준다. (없으면 시안의 7px)
            style={{ paddingBottom: Math.max(insets.bottom, 7) }}
        >
            {tabs}
        </View>
    );
}

function AgentButton({ badgeCount }: { badgeCount: number }) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel="에이전트 열기"
            className="h-17 flex-1 items-center justify-end pb-1.5 active:opacity-80"
            onPress={() => router.push('/agent')}
        >
            {/* 마스코트 캐릭터가 나오기 전까지 시안과 같은 점선 자리 표시 */}
            <View className="absolute -top-6.5 h-14.5 w-14.5 items-center justify-center rounded-24 border-1.5 border-dashed border-primary-600 bg-primary-50">
                <AppText className="font-bold text-10 text-primary-700">캐릭터</AppText>
            </View>
            {badgeCount > 0 && (
                <View className="absolute -top-7 left-1/2 ml-3 h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-primary-700 px-1">
                    <AppText className="font-bold text-11 text-white">{badgeCount}</AppText>
                </View>
            )}
            <AppText className="font-bold text-12 text-primary-700">에이전트</AppText>
        </Pressable>
    );
}
