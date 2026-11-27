import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { Screen } from '@/shared/components/layout/Screen';
import { ScreenHeader } from '@/shared/components/layout/ScreenHeader';
import { AppText } from '@/shared/components/ui/AppText';
import { Button } from '@/shared/components/ui/Button';
import { ScreenState } from '@/shared/components/ui/ScreenState';
import { ApiError } from '@/shared/types/api';

import { useApplyGoalGuardMutation } from '@/features/block/api/useApplyGoalGuardMutation';
import { useGoalGuardQuery } from '@/features/block/api/useGoalGuardQuery';
import { GoalGuardOptionCard } from '@/features/block/components/GoalGuardOptionCard';
import { GoalGuardPremiumCard } from '@/features/block/components/GoalGuardPremiumCard';
import { GoalGuardSummaryCard } from '@/features/block/components/GoalGuardSummaryCard';
import type { GoalGuard } from '@/features/block/types/goalGuard';
import { GOAL_GUARD_ERROR_CODE } from '@/features/block/types/goalGuard';

/** 16 목표 지키기 (F-08) — 늦어지는 목표형 블록을 맞출 방법을 골라 바로 반영한다. */
export function GoalGuardScreen() {
    const params = useLocalSearchParams<{ blockId: string }>();
    const blockId = Number(params.blockId);
    const isValidId = Number.isInteger(blockId) && blockId > 0;
    const guard = useGoalGuardQuery(blockId);
    const isNotLate =
        !isValidId ||
        (guard.error instanceof ApiError && guard.error.code === GOAL_GUARD_ERROR_CODE.NOT_LATE);

    return (
        <Screen>
            <ScreenHeader title={guard.data ? `${guard.data.block.name} 목표 지키기` : ''} />
            {/* 이미 맞춰진 블록이면 받아 둔 방법이 있어도 빈 화면을 먼저 보여준다. (다른 기기에서 맞춘 경우 등) */}
            {isNotLate ? (
                <ScreenState
                    variant="empty"
                    title="지금은 맞출 게 없어요"
                    description="목표일에 맞춰 모이고 있어요"
                    actionTitle="돌아가기"
                    onPressAction={router.back}
                />
            ) : guard.data ? (
                // 다시 받다가 다른 이유로 실패해도 받아 둔 값이 있으면 그대로 보여준다.
                <GoalGuardContent guard={guard.data} />
            ) : guard.isError ? (
                <ScreenState
                    variant="error"
                    title="방법을 불러오지 못했어요"
                    description="잠시 후 다시 시도해 주세요"
                    actionTitle="다시 시도"
                    onPressAction={() => guard.refetch()}
                />
            ) : (
                <ScreenState variant="loading" title="맞출 방법을 찾는 중이에요" />
            )}
        </Screen>
    );
}

interface GoalGuardContentProps {
    guard: GoalGuard;
}

function GoalGuardContent({ guard }: GoalGuardContentProps) {
    const recommendedId =
        guard.options.find((option) => option.isRecommended)?.optionId ??
        guard.options[0]?.optionId ??
        null;
    const [selectedId, setSelectedId] = useState<string | null>(recommendedId);
    const apply = useApplyGoalGuardMutation();
    // 다시 받은 목록에 고른 방법이 없으면 추천으로 돌아간다.
    const effectiveId = guard.options.some((option) => option.optionId === selectedId)
        ? selectedId
        : recommendedId;

    const handleApply = () => {
        if (!effectiveId || apply.isPending) return;
        apply.mutate(
            {
                blockId: guard.block.blockId,
                body: { optionId: effectiveId, version: guard.version },
            },
            {
                onSuccess: () => router.back(),
                onError: (error) => {
                    if (
                        error instanceof ApiError &&
                        error.code === GOAL_GUARD_ERROR_CODE.VERSION_CONFLICT
                    ) {
                        Alert.alert(
                            '블록이 바뀌었어요',
                            '바뀐 값으로 다시 계산했어요. 확인하고 다시 눌러 주세요',
                        );
                        return;
                    }
                    Alert.alert('반영하지 못했어요', '잠시 후 다시 시도해 주세요');
                },
            },
        );
    };

    return (
        <View className="flex-1">
            <ScrollView contentContainerClassName="px-5 pb-6 pt-1">
                <AppText className="font-bold text-24">{guard.headline}</AppText>
                <AppText className="mt-2 text-15 text-ink-sub">{guard.message}</AppText>

                <View className="mt-5">
                    <GoalGuardSummaryCard guard={guard} />
                </View>

                <AppText className="mt-6 font-semibold text-13 text-ink-sub">맞출 방법</AppText>
                <View accessibilityRole="radiogroup" className="mt-2 gap-2">
                    {guard.options.map((option) => (
                        <GoalGuardOptionCard
                            key={option.optionId}
                            option={option}
                            isSelected={option.optionId === effectiveId}
                            onPress={() => setSelectedId(option.optionId)}
                        />
                    ))}
                </View>

                <View className="mt-4">
                    <GoalGuardPremiumCard />
                </View>
            </ScrollView>

            <View className="border-t border-line px-5 pb-2 pt-3">
                <Button
                    title="이 방법으로 할게요"
                    loadingTitle="반영하는 중"
                    isLoading={apply.isPending}
                    disabled={!effectiveId}
                    onPress={handleApply}
                />
                <Pressable
                    accessibilityRole="button"
                    disabled={apply.isPending}
                    onPress={router.back}
                    className="mt-1 h-11 items-center justify-center active:opacity-60"
                >
                    <AppText className="font-semibold text-15 text-ink-sub">
                        지금은 괜찮아요
                    </AppText>
                </Pressable>
            </View>
        </View>
    );
}
