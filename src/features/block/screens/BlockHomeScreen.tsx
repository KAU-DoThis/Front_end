import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { cn } from '@/lib/cn';
import { formatWon } from '@/lib/format';
import { Screen } from '@/shared/components/layout/Screen';
import { DropletLayerProvider, useDragState } from '@/shared/components/motion/DropletLayer';
import { AppText } from '@/shared/components/ui/AppText';
import { getWaterColor } from '@/shared/components/ui/BlockBeaker';
import { Button } from '@/shared/components/ui/Button';
import { Icon } from '@/shared/components/ui/Icon';
import { colors } from '@/styles/tokens';

import { useBlockHomeQuery } from '@/features/block/api/useBlockHomeQuery';
import { AgentBanner } from '@/features/block/components/AgentBanner';
import { AssetCardPager } from '@/features/block/components/AssetCardPager';
import { BlockGrid } from '@/features/block/components/BlockGrid';
import { DragHint } from '@/features/block/components/DragHint';
import { HomeHeader } from '@/features/block/components/HomeHeader';
import { PendingMoneySection } from '@/features/block/components/PendingMoneySection';
import { TransferSheet } from '@/features/block/components/TransferSheet';
import type { HomeBlock } from '@/features/block/types/block';
import type { AgentMessage, BlockHome } from '@/features/block/types/blockHome';
import {
    useCoachActivityStore,
    type CoachMove,
} from '@/features/suggestion/stores/coachActivityStore';
import { withRo } from '@/features/suggestion/utils/coachText';

/** 01 홈 · 블록 탭 */
export function BlockHomeScreen() {
    const { data: home, isPending, isError, refetch } = useBlockHomeQuery();

    return (
        <Screen edges={['top']}>
            <HomeHeader hasUnreadNotification={(home?.unreadNotificationCount ?? 0) > 0} />
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
                // 물방울은 스크롤 영역 위 레이어에 그린다. (블록 안에 그리면 잘린다)
                <DropletLayerProvider>
                    <HomeContent home={home} />
                </DropletLayerProvider>
            )}
        </Screen>
    );
}

interface TransferTarget {
    fromBlockId: number;
    toBlockId: number;
}

function HomeContent({ home }: { home: BlockHome }) {
    const [isDragging, setIsDragging] = useState(false);
    const [transfer, setTransfer] = useState<TransferTarget | null>(null);
    const { sourceId, hoverId } = useDragState();

    const sourceBlock = home.blocks.find((block) => block.blockId === sourceId) ?? null;
    const hoverBlock = home.blocks.find((block) => block.blockId === hoverId) ?? null;
    // 드래그 중엔 블록 말고는 흐리게 (03-1)
    const dimClass = sourceBlock ? 'opacity-40' : undefined;
    // 4-1: 방금 초불이가 옮긴 일이 있으면 배너를 그 이야기로 바꾼다. (되돌렸으면 원래 배너)
    const lastMove = useCoachActivityStore((state) => state.moves[0]);
    const recentMove = lastMove && !lastMove.undoResult ? lastMove : null;
    const agentMessage = recentMove ? toMoveMessage(recentMove) : home.agentMessage;

    const handlePressBlock = (block: HomeBlock) => {
        router.push({ pathname: '/block/[blockId]', params: { blockId: String(block.blockId) } });
    };

    return (
        <View className="flex-1">
            <ScrollView contentContainerClassName="px-5 pb-10" scrollEnabled={!isDragging}>
                <View className={dimClass}>
                    <AssetCardPager home={home} />
                </View>
                {agentMessage && (
                    <View className={cn('mt-3', dimClass)}>
                        <AgentBanner
                            message={agentMessage}
                            onPress={() =>
                                router.push(
                                    recentMove
                                        ? {
                                              pathname: '/agent',
                                              params: { proposalId: String(recentMove.proposalId) },
                                          }
                                        : '/agent',
                                )
                            }
                        />
                    </View>
                )}

                <View className={cn('mt-5 flex-row items-center', dimClass)}>
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
                <View className={cn('mt-3', dimClass)}>
                    <PendingMoneySection items={home.pendingMoney} />
                </View>

                <View className="mt-3">
                    <BlockGrid
                        blocks={home.blocks}
                        totalAssets={home.totalAssets}
                        onPressBlock={handlePressBlock}
                        onDropBlock={(fromBlockId, toBlockId) =>
                            setTransfer({ fromBlockId, toBlockId })
                        }
                        onDraggingChange={setIsDragging}
                    />
                </View>
            </ScrollView>

            {sourceBlock && (
                <DragHint
                    color={getWaterColor(sourceBlock.color, sourceBlock.status)}
                    targetName={hoverBlock?.name ?? null}
                />
            )}

            {/* 03-1에서 놓으면 두 블록이 채워진 03-2가 열린다. 둘 다 직접 고른 이동이라 고정하지 않는다. */}
            <TransferSheet
                isOpen={transfer !== null}
                onClose={() => setTransfer(null)}
                initialFromBlockId={transfer?.fromBlockId ?? null}
                initialToBlockId={transfer?.toBlockId ?? null}
            />
        </View>
    );
}

/** 초불이가 옮긴 일 배너 문구 (4-1) */
function toMoveMessage({ result, dailyBudget }: CoachMove): AgentMessage {
    return {
        title: `방금 ${withRo(result.to.name)} ${formatWon(result.amount)} 옮겼어요`,
        body: dailyBudget
            ? `하루 쓸 수 있는 돈이 ${formatWon(dailyBudget.after)}이 됐어요`
            : `${result.to.name}에 ${formatWon(result.to.balanceAfter)} 있어요`,
    };
}
