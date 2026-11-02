import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { Screen } from '@/shared/components/layout/Screen';
import { AppText } from '@/shared/components/ui/AppText';
import { Button } from '@/shared/components/ui/Button';
import { Icon } from '@/shared/components/ui/Icon';
import { colors } from '@/styles/tokens';

import { useBlockHomeQuery } from '@/features/block/api/useBlockHomeQuery';
import { AgentBanner } from '@/features/block/components/AgentBanner';
import { AssetCardPager } from '@/features/block/components/AssetCardPager';
import { BlockGrid } from '@/features/block/components/BlockGrid';
import { HomeHeader } from '@/features/block/components/HomeHeader';
import { PendingMoneySection } from '@/features/block/components/PendingMoneySection';
import type { HomeBlock } from '@/features/block/types/block';

/** 01 홈 · 블록 탭 */
export function BlockHomeScreen() {
    const { data: home, isPending, isError, refetch } = useBlockHomeQuery();

    const handlePressBlock = (block: HomeBlock) => {
        router.push({ pathname: '/block/[blockId]', params: { blockId: String(block.blockId) } });
    };

    return (
        <Screen edges={['top']}>
            <HomeHeader hasUnreadNotification />
            {isPending ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color={colors.primary[700]} />
                </View>
            ) : isError ? (
                <View className="flex-1 items-center justify-center gap-4 px-5">
                    <AppText className="text-ink-sub">홈 정보를 불러오지 못했어요</AppText>
                    <Button
                        title="다시 시도"
                        variant="secondary"
                        size="sm"
                        onPress={() => refetch()}
                    />
                </View>
            ) : (
                <ScrollView contentContainerClassName="px-5 pb-10">
                    <AssetCardPager home={home} />
                    {home.agentMessage && (
                        <View className="mt-3">
                            <AgentBanner
                                message={home.agentMessage}
                                onPress={() => router.push('/agent')}
                            />
                        </View>
                    )}

                    <View className="mt-5 flex-row items-center">
                        <AppText className="font-bold text-17">
                            내 블록{' '}
                            <AppText className="text-17 text-ink-sub">{home.blocks.length}</AppText>
                        </AppText>
                        {/* 블록 추가(04 블록 구성)는 해당 작업에서 연결한다. */}
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="블록 추가"
                            hitSlop={6}
                            className="ml-3 h-8 flex-row items-center gap-0.5 rounded-16 border border-dashed border-primary-700 px-2.5 active:bg-primary-50"
                        >
                            <Icon
                                name="plus"
                                size={10}
                                strokeWidth={1.65}
                                color={colors.primary[700]}
                            />
                            <AppText className="font-semibold text-12 text-primary-700">
                                블록 추가
                            </AppText>
                        </Pressable>
                        <AppText className="ml-auto text-12 text-ink-sub">
                            꾹 눌러서 다른 블록으로 옮기기
                        </AppText>
                    </View>

                    {/* 나누기(⑤ 대기 블록 배분)는 해당 작업에서 onSplit으로 연결한다. */}
                    <View className="mt-3">
                        <PendingMoneySection items={home.pendingMoney} />
                    </View>

                    <View className="mt-3">
                        <BlockGrid
                            blocks={home.blocks}
                            totalAssets={home.totalAssets}
                            onPressBlock={handlePressBlock}
                        />
                    </View>
                </ScrollView>
            )}
        </Screen>
    );
}
