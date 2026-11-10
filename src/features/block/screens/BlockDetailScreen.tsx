import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { Screen } from '@/shared/components/layout/Screen';
import { ScreenHeader } from '@/shared/components/layout/ScreenHeader';
import { AppText } from '@/shared/components/ui/AppText';
import { Button } from '@/shared/components/ui/Button';
import { Icon } from '@/shared/components/ui/Icon';
import { colors } from '@/styles/tokens';

import { useBlockDetailQuery } from '@/features/block/api/useBlockDetailQuery';
import { FixedDetailContent } from '@/features/block/components/FixedDetailContent';
import { GoalDetailContent } from '@/features/block/components/GoalDetailContent';
import { RenameBlockSheet } from '@/features/block/components/RenameBlockSheet';
import { SpendingDetailContent } from '@/features/block/components/SpendingDetailContent';
import { TransferSheet } from '@/features/block/components/TransferSheet';
import type { BlockDetail } from '@/features/block/types/blockDetail';

/** 02 블록 상세 — 블록 유형(사용형 · 목표형 · 고정지출형)에 맞는 화면을 보여준다. */
export function BlockDetailScreen() {
    const { blockId } = useLocalSearchParams<{ blockId: string }>();
    const id = Number(blockId);
    // 숫자가 아닌 ID(딥링크 block/abc 등)는 쿼리가 꺼진 채 isPending으로 남으므로 먼저 걸러 낸다.
    const isValidId = Number.isInteger(id) && id > 0;
    const { data: detail, isPending, isError, refetch } = useBlockDetailQuery(id);
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    // 이름 바꾸기 시트를 열 때마다 입력칸을 지금 이름으로 새로 시작한다.
    const [renameFormKey, setRenameFormKey] = useState(0);

    const openRename = () => {
        setRenameFormKey((key) => key + 1);
        setIsRenameOpen(true);
    };

    return (
        <Screen>
            <ScreenHeader
                title={detail?.block.name ?? ''}
                right={
                    // 지금은 이름 바꾸기만 연다. 블록 수정·삭제 메뉴는 블록 관리 작업에서 붙인다.
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="블록 이름 바꾸기"
                        hitSlop={12}
                        disabled={!detail}
                        onPress={openRename}
                        className="active:opacity-60"
                    >
                        <Icon name="more" size={20} />
                    </Pressable>
                }
            />
            {!isValidId ? (
                <NotReady />
            ) : isPending ? (
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
                    <DetailContent
                        detail={detail}
                        onFillFromOther={() => setIsTransferOpen(true)}
                    />
                </ScrollView>
            ) : (
                <NotReady />
            )}
            {/* 다른 블록에서 채우기: 이 블록을 받는 블록으로 고정하고, 보내는 블록만 시트에서 고른다. */}
            <TransferSheet
                isOpen={isTransferOpen}
                onClose={() => setIsTransferOpen(false)}
                initialToBlockId={isValidId ? id : null}
                lockedSide="to"
            />
            {detail && (
                <RenameBlockSheet
                    isOpen={isRenameOpen}
                    onClose={() => setIsRenameOpen(false)}
                    blockId={detail.block.blockId}
                    currentName={detail.block.name}
                    formKey={renameFormKey}
                />
            )}
        </Screen>
    );
}

function NotReady() {
    return (
        <View className="flex-1 items-center justify-center px-5">
            <AppText className="text-ink-sub">이 블록의 상세 화면은 준비 중이에요</AppText>
        </View>
    );
}

interface DetailContentProps {
    detail: BlockDetail;
    onFillFromOther: () => void;
}

function DetailContent({ detail, onFillFromOther }: DetailContentProps) {
    switch (detail.type) {
        case 'SPENDING':
            return <SpendingDetailContent detail={detail} onFillFromOther={onFillFromOther} />;
        case 'GOAL':
            return <GoalDetailContent detail={detail} />;
        case 'FIXED':
            return <FixedDetailContent detail={detail} onFillFromOther={onFillFromOther} />;
    }
}
