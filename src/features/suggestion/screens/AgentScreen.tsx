import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    BackHandler,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    useWindowDimensions,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatAmount } from '@/lib/format';
import { Screen } from '@/shared/components/layout/Screen';
import { AppText } from '@/shared/components/ui/AppText';
import { Button } from '@/shared/components/ui/Button';
import { colors } from '@/styles/tokens';

import { useAgentRoomQuery } from '@/features/suggestion/api/useAgentRoomQuery';
import { AgentHomePanel } from '@/features/suggestion/components/AgentHomePanel';
import { AgentRoomHeader } from '@/features/suggestion/components/AgentRoomHeader';
import type { RoomObject } from '@/features/suggestion/components/roomLayout';
import { RoomScene, type RoomObjectLabel } from '@/features/suggestion/components/RoomScene';
import { ShelfPanel } from '@/features/suggestion/components/ShelfPanel';
import type { AgentRoom } from '@/features/suggestion/types/agentRoom';

/** 초불이가 서 있는 곳 — 방 가운데(1) · 선반 앞(1-1) */
type RoomSpot = 'center' | 'shelf';

/** 초불이의 방 (하단 탭 가운데 버튼으로 여는 전체 화면) */
export function AgentScreen() {
    const { data: room, isPending, isError, refetch } = useAgentRoomQuery();

    return (
        <Screen edges={['top']} className="bg-primary-900">
            <StatusBar style="light" />
            {isPending ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color={colors.white} />
                </View>
            ) : isError ? (
                <View className="flex-1 items-center justify-center gap-4 px-5">
                    <AppText className="text-primary-100">초불이의 방을 불러오지 못했어요</AppText>
                    <Button
                        title="다시 시도"
                        variant="secondary"
                        size="sm"
                        onPress={() => refetch()}
                    />
                </View>
            ) : (
                <AgentRoomContent room={room} />
            )}
        </Screen>
    );
}

function AgentRoomContent({ room }: { room: AgentRoom }) {
    const insets = useSafeAreaInsets();
    const [spot, setSpot] = useState<RoomSpot>('center');
    const { width: screenWidth } = useWindowDimensions();
    const isAtShelf = spot === 'shelf';

    // 선반 앞에서 Android 뒤로 가기를 누르면 방을 닫지 않고 방 가운데로 돌아온다.
    useEffect(() => {
        if (!isAtShelf) return;
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
            setSpot('center');
            return true;
        });
        return () => subscription.remove();
    }, [isAtShelf]);

    const handlePressObject = (object: RoomObject) => {
        switch (object) {
            case 'shelf':
                setSpot('shelf');
                return;
            case 'frame':
                if (room.goal) {
                    router.dismissTo({
                        pathname: '/block/[blockId]',
                        params: { blockId: String(room.goal.blockId) },
                    });
                }
                return;
            case 'plant':
                router.dismissTo('/saving');
                return;
            case 'desk':
                router.dismissTo('/report');
                return;
            case 'receipt':
                router.dismissTo('/transactions');
        }
    };

    const handleCommand = () => {
        // 명령을 액션으로 바꾸고 응답 화면을 보여주는 건 다음 이슈(명령 처리)에서 붙인다.
        Keyboard.dismiss();
    };

    const hasAttention = room.attentionBlockCount > 0;
    const subtitle = isAtShelf
        ? '블록 선반'
        : hasAttention
          ? `블록 ${room.blockCount}개 중 ${room.attentionBlockCount}개가 주의예요`
          : `블록 ${room.blockCount}개 모두 안전해요`;
    const shelfMessage = hasAttention
        ? `블록 선반이에요. 주의 블록이 ${room.attentionBlockCount}개 있어요.`
        : '블록 선반이에요. 모두 안전해요.';

    return (
        <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <AgentRoomHeader
                subtitle={subtitle}
                isAttention={!isAtShelf && hasAttention}
                leading={isAtShelf ? 'back' : 'close'}
                onPressLeading={isAtShelf ? () => setSpot('center') : () => router.back()}
            />

            {/* 방은 항상 화면 너비로 그리고, 아래 패널이 방 아랫부분을 덮는다. (시안과 같은 겹침) */}
            <View className="flex-1 pt-2">
                <RoomScene
                    width={screenWidth}
                    spot={spot}
                    pose="basic"
                    halo="healthy"
                    labels={getObjectLabels(room)}
                    shelfMessage={shelfMessage}
                    onPressObject={handlePressObject}
                />

                <View
                    className="absolute bottom-0 left-0 right-0 rounded-t-24 bg-surface-app px-5 pt-5"
                    style={{ paddingBottom: insets.bottom + 16 }}
                >
                    {isAtShelf ? (
                        <ShelfPanel
                            blocks={room.shelfBlocks}
                            onPressBlock={(blockId) =>
                                router.dismissTo({
                                    pathname: '/block/[blockId]',
                                    params: { blockId: String(blockId) },
                                })
                            }
                            onPressBlockTab={() => router.dismissTo('/')}
                        />
                    ) : (
                        <AgentHomePanel room={room} onCommand={handleCommand} />
                    )}
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

/** 방 안 물건 이름표 (선반 = 블록 · 책상 = 리포트 · 화분 = 절약 · 영수증 상자 = 내역 · 액자 = 목표) */
function getObjectLabels(room: AgentRoom): RoomObjectLabel[] {
    const labels: RoomObjectLabel[] = [
        {
            object: 'shelf',
            label: `내 블록 ${room.blockCount}`,
            accessibilityHint: '블록 요약을 보여줘요',
        },
        {
            object: 'plant',
            label: `절약 ${formatAmount(room.confirmedSaving, { showUnit: false })}`,
            accessibilityHint: '절약 탭으로 가요',
        },
        { object: 'desk', label: '리포트', accessibilityHint: '리포트 탭으로 가요' },
        {
            object: 'receipt',
            label:
                room.uncheckedTransactionCount > 0
                    ? `확인할 거래 ${room.uncheckedTransactionCount}`
                    : '내역',
            hasDot: room.uncheckedTransactionCount > 0,
            accessibilityHint: '내역 탭으로 가요',
        },
    ];

    if (room.goal) {
        labels.push({
            object: 'frame',
            label: `${room.goal.name} 목표 ${room.goal.achievementRate}%`,
            accessibilityHint: '목표 블록 상세로 가요',
        });
    }

    return labels;
}
