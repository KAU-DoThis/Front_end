import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { Screen } from '@/shared/components/layout/Screen';
import { ScreenHeader } from '@/shared/components/layout/ScreenHeader';
import { AppText } from '@/shared/components/ui/AppText';
import { Button } from '@/shared/components/ui/Button';
import { Icon } from '@/shared/components/ui/Icon';
import { colors } from '@/styles/tokens';

import { useBlockDetailQuery } from '@/features/block/api/useBlockDetailQuery';
import { GoalDetailContent } from '@/features/block/components/GoalDetailContent';
import { SpendingDetailContent } from '@/features/block/components/SpendingDetailContent';
import type { BlockDetail } from '@/features/block/types/blockDetail';

/** 02 블록 상세 — 블록 유형(사용형 · 목표형 · 고정지출형)에 맞는 화면을 보여준다. */
export function BlockDetailScreen() {
    const { blockId } = useLocalSearchParams<{ blockId: string }>();
    const { data: detail, isPending, isError, refetch } = useBlockDetailQuery(Number(blockId));

    return (
        <Screen>
            <ScreenHeader
                title={detail?.block.name ?? ''}
                right={
                    // 블록 수정·삭제 메뉴는 블록 관리 작업에서 연결한다.
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="더보기"
                        hitSlop={12}
                        className="active:opacity-60"
                    >
                        <Icon name="more" size={20} />
                    </Pressable>
                }
            />
            {isPending ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color={colors.primary[700]} />
                </View>
            ) : isError ? (
                <View className="flex-1 items-center justify-center gap-4 px-5">
                    <AppText className="text-ink-sub">블록 정보를 불러오지 못했어요</AppText>
                    <Button
                        title="다시 시도"
                        variant="secondary"
                        size="sm"
                        onPress={() => refetch()}
                    />
                </View>
            ) : detail ? (
                <ScrollView contentContainerClassName="px-5 pb-8">
                    <DetailContent detail={detail} />
                </ScrollView>
            ) : (
                <View className="flex-1 items-center justify-center px-5">
                    <AppText className="text-ink-sub">이 블록의 상세 화면은 준비 중이에요</AppText>
                </View>
            )}
        </Screen>
    );
}

function DetailContent({ detail }: { detail: BlockDetail }) {
    switch (detail.type) {
        case 'SPENDING':
            return <SpendingDetailContent detail={detail} />;
        case 'GOAL':
            return <GoalDetailContent detail={detail} />;
    }
}
