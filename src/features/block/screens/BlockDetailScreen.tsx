import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';

import { formatWon } from '@/lib/format';

import { Screen } from '@/shared/components/layout/Screen';
import { ScreenHeader } from '@/shared/components/layout/ScreenHeader';
import { AppText } from '@/shared/components/ui/AppText';
import { Button } from '@/shared/components/ui/Button';
import { Icon } from '@/shared/components/ui/Icon';
import { ApiError } from '@/shared/types/api';
import { colors } from '@/styles/tokens';

import { useBlockDetailQuery } from '@/features/block/api/useBlockDetailQuery';
import { useDeleteBlockMutation } from '@/features/block/api/useDeleteBlockMutation';
import { BlockMenuSheet, type BlockMenuItem } from '@/features/block/components/BlockMenuSheet';
import { EditBlockSheet, type EditBlockPicker } from '@/features/block/components/EditBlockSheet';
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
    const [openSheet, setOpenSheet] = useState<'menu' | 'rename' | 'edit' | null>(null);
    // 이름 바꾸기·수정 시트를 열 때마다 입력칸을 지금 블록 값으로 새로 시작한다.
    const [formKey, setFormKey] = useState(0);
    const [editPicker, setEditPicker] = useState<EditBlockPicker>(null);

    const openForm = (sheet: 'rename' | 'edit', picker: EditBlockPicker = null) => {
        setFormKey((key) => key + 1);
        setEditPicker(picker);
        setOpenSheet(sheet);
    };
    const closeSheet = () => setOpenSheet(null);

    const { mutate: removeBlock, isPending: isDeleting } = useDeleteBlockMutation();
    const confirmDelete = () => {
        if (!detail) return;
        const { blockId, balance } = detail.block;
        Alert.alert(
            '이 블록을 지울까요?',
            balance > 0 ? `남은 ${formatWon(balance)}은 나눌 돈으로 돌아가요` : undefined,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: () =>
                        removeBlock(blockId, {
                            onSuccess: () => router.dismissTo('/'),
                            onError: (error) =>
                                error instanceof ApiError &&
                                error.code === 'BLOCK_DEFAULT_UNDELETABLE'
                                    ? Alert.alert('기본 블록은 지울 수 없어요')
                                    : Alert.alert(
                                          '블록을 지우지 못했어요',
                                          '잠시 후 다시 시도해 주세요.',
                                      ),
                        }),
                },
            ],
        );
    };

    const menuItems: BlockMenuItem[] = [
        { label: '이름 바꾸기', onPress: () => openForm('rename') },
        { label: '블록 수정', onPress: () => openForm('edit') },
        // 기본 블록(기본 생활비)은 서버가 지우지 못하게 막아서 메뉴에서 뺀다.
        ...(detail && !detail.block.isDefault
            ? [{ label: '블록 삭제', onPress: confirmDelete, isDanger: true }]
            : []),
    ];

    return (
        <Screen>
            <ScreenHeader
                title={detail?.block.name ?? ''}
                right={
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="블록 관리"
                        hitSlop={12}
                        // 지우는 중에는 메뉴를 다시 열지 못하게 막고 로딩을 보여준다.
                        disabled={!detail || isDeleting}
                        accessibilityState={{ busy: isDeleting }}
                        onPress={() => setOpenSheet('menu')}
                        className="active:opacity-60"
                    >
                        {isDeleting ? (
                            <ActivityIndicator size="small" color={colors.primary[700]} />
                        ) : (
                            <Icon name="more" size={20} />
                        )}
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
                        onEdit={(picker) => openForm('edit', picker)}
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
            <BlockMenuSheet
                isOpen={openSheet === 'menu'}
                onClose={closeSheet}
                title={detail?.block.name ?? ''}
                items={menuItems}
            />
            {detail && (
                <>
                    <RenameBlockSheet
                        isOpen={openSheet === 'rename'}
                        onClose={closeSheet}
                        blockId={detail.block.blockId}
                        currentName={detail.block.name}
                        version={detail.version}
                        formKey={formKey}
                    />
                    <EditBlockSheet
                        isOpen={openSheet === 'edit'}
                        onClose={closeSheet}
                        detail={detail}
                        formKey={formKey}
                        initialPicker={editPicker}
                    />
                </>
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
    /** 블록 수정 시트 열기 (picker: 바로 띄울 고르기 시트) */
    onEdit: (picker?: EditBlockPicker) => void;
}

function DetailContent({ detail, onFillFromOther, onEdit }: DetailContentProps) {
    switch (detail.type) {
        case 'SPENDING':
            return <SpendingDetailContent detail={detail} onFillFromOther={onFillFromOther} />;
        case 'GOAL':
            return (
                <GoalDetailContent detail={detail} onPostponeDueDate={() => onEdit('dueDate')} />
            );
        case 'FIXED':
            return (
                <FixedDetailContent
                    detail={detail}
                    onFillFromOther={onFillFromOther}
                    onEditRule={() => onEdit()}
                />
            );
    }
}
