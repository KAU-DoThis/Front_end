import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    BackHandler,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    useWindowDimensions,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatAmount } from '@/lib/format';
import { Screen } from '@/shared/components/layout/Screen';
import { AppText } from '@/shared/components/ui/AppText';
import { Button } from '@/shared/components/ui/Button';
import { ApiError } from '@/shared/types/api';
import { colors } from '@/styles/tokens';

import { useAcceptProposalMutation } from '@/features/suggestion/api/useAcceptProposalMutation';
import { useAgentRoomQuery } from '@/features/suggestion/api/useAgentRoomQuery';
import { useCoachRoomQuery } from '@/features/suggestion/api/useCoachRoomQuery';
import { useSendCoachMessageMutation } from '@/features/suggestion/api/useSendCoachMessageMutation';
import { useUndoProposalMutation } from '@/features/suggestion/api/useUndoProposalMutation';
import { ActivityLogPanel } from '@/features/suggestion/components/ActivityLogPanel';
import { AgentHomePanel } from '@/features/suggestion/components/AgentHomePanel';
import { AgentRoomHeader } from '@/features/suggestion/components/AgentRoomHeader';
import { CoachThinkingPanel } from '@/features/suggestion/components/CoachThinkingPanel';
import { ProposalPanel } from '@/features/suggestion/components/ProposalPanel';
import {
    ROOM_LABEL_SAFE_HEIGHT,
    ROOM_SIZE,
    type RoomObject,
} from '@/features/suggestion/components/roomLayout';
import { RoomScene, type RoomObjectLabel } from '@/features/suggestion/components/RoomScene';
import { ShelfPanel } from '@/features/suggestion/components/ShelfPanel';
import { TransferResultPanel } from '@/features/suggestion/components/TransferResultPanel';
import { UndoProposalSheet } from '@/features/suggestion/components/UndoProposalSheet';
import {
    useCoachActivityStore,
    type CoachMove,
} from '@/features/suggestion/stores/coachActivityStore';
import type { AgentMoodCode, AgentRoom } from '@/features/suggestion/types/agentRoom';
import { COACH_ERROR_CODE, type TransferProposalCard } from '@/features/suggestion/types/coach';

/** 초불이가 서 있는 곳 — 방 가운데(1) · 선반 앞(1-1) */
type RoomSpot = 'center' | 'shelf';

/** 초불이의 방 (하단 탭 가운데 버튼으로 여는 전체 화면) */
export function AgentScreen() {
    const { data: room, isPending, isError, refetch } = useAgentRoomQuery();

    return (
        <Screen edges={['top']} className="bg-primary-900">
            <StatusBar style="light" />
            {isPending || isError ? (
                // 불러오지 못해도 방을 닫을 수 있게 상단 바는 그대로 둔다.
                <>
                    <AgentRoomHeader leading="close" onPressLeading={() => router.back()} />
                    <View className="flex-1 items-center justify-center gap-4 px-5">
                        {isPending ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <>
                                <AppText className="text-primary-100">
                                    초불이의 방을 불러오지 못했어요
                                </AppText>
                                <Button
                                    title="다시 시도"
                                    variant="secondary"
                                    size="sm"
                                    onPress={() => refetch()}
                                />
                            </>
                        )}
                    </View>
                </>
            ) : (
                <AgentRoomContent room={room} />
            )}
        </Screen>
    );
}

/**
 * 아래 패널 상태
 * home: 1 기본 · thinking: 2-0 생각하는 중 · confirm: 2 명령 → 확인
 * result: 4 완료 / 8-2 되돌린 뒤 · history: 8 초불이가 한 일
 */
type Panel =
    | { kind: 'home' }
    | { kind: 'thinking'; text: string }
    | { kind: 'confirm'; text: string; card: TransferProposalCard }
    | { kind: 'result'; proposalId: number }
    | { kind: 'history' };

const PANEL_SUBTITLE: Partial<Record<Panel['kind'], string>> = {
    thinking: '생각하는 중',
    confirm: '옮기기 전에 확인해 주세요',
    history: '초불이가 한 일',
};

/** 서버 에러를 초불이 말로 바꾼다. */
function toErrorMessage(error: unknown) {
    if (error instanceof ApiError) {
        switch (error.code) {
            case COACH_ERROR_CODE.PROPOSAL_STALE:
                return '그 사이에 블록이 바뀌었어요. 다시 말해 주세요.';
            case COACH_ERROR_CODE.PROPOSAL_EXPIRED:
                return '제안 시간이 지났어요. 다시 말해 주세요.';
            case COACH_ERROR_CODE.UNDO_INSUFFICIENT_BALANCE:
                return '받은 블록에 돈이 모자라서 되돌릴 수 없어요.';
        }
    }
    return '지금은 하기 어려워요. 잠시 후 다시 해 주세요.';
}

function AgentRoomContent({ room }: { room: AgentRoom }) {
    const insets = useSafeAreaInsets();
    const [spot, setSpot] = useState<RoomSpot>('center');
    const { width: screenWidth } = useWindowDimensions();
    const [areaHeight, setAreaHeight] = useState(0);
    const [mainPanelHeight, setMainPanelHeight] = useState(0);
    const isAtShelf = spot === 'shelf';
    // 개발용: 기분·그림 방식을 바꿔 보기 (null이면 서버 값)
    const [devMood, setDevMood] = useState<DevMood | null>(null);

    // 홈 배너(4-1)에서 들어오면 그 이동의 결과(4)부터 보여준다.
    const { proposalId: openProposalId } = useLocalSearchParams<{ proposalId?: string }>();
    const moves = useCoachActivityStore((state) => state.moves);
    const addMove = useCoachActivityStore((state) => state.addMove);
    const markUndone = useCoachActivityStore((state) => state.markUndone);
    const [panel, setPanel] = useState<Panel>(() =>
        openProposalId ? { kind: 'result', proposalId: Number(openProposalId) } : { kind: 'home' },
    );
    /** 초불이 말풍선 (null이면 물건 이름표) */
    const [bubble, setBubble] = useState<string | null>(null);
    const [undoTarget, setUndoTarget] = useState<CoachMove | null>(null);

    const { data: coachRoom } = useCoachRoomQuery();
    const sendMessage = useSendCoachMessageMutation();
    const accept = useAcceptProposalMutation();
    const undo = useUndoProposalMutation();
    const abortRef = useRef<AbortController | null>(null);

    const resultMove =
        panel.kind === 'result'
            ? (moves.find((move) => move.proposalId === panel.proposalId) ?? null)
            : null;
    const mood = devMood && devMood !== 'OFFLINE' ? devMood : resultMove ? 'HAPPY' : room.mood.code;
    const offline = devMood ? devMood === 'OFFLINE' : !room.aiAvailable;
    // 결과를 찾지 못하면(앱을 다시 켜 기록이 사라짐) 기본 패널을 보여준다.
    const isHomePanel =
        !isAtShelf && (panel.kind === 'home' || (panel.kind === 'result' && !resultMove));

    const goHome = () => {
        setPanel({ kind: 'home' });
        setBubble(null);
    };

    const handleCancel = () => {
        abortRef.current?.abort();
        goHome();
    };

    // 기본 화면이 아닐 때 Android 뒤로 가기를 누르면 방을 닫지 않고 기본 화면으로 돌아온다.
    const isNested =
        isAtShelf ||
        panel.kind === 'thinking' ||
        panel.kind === 'confirm' ||
        panel.kind === 'history';
    useEffect(() => {
        if (!isNested) return;
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
            if (isAtShelf) {
                setSpot('center');
            } else {
                abortRef.current?.abort();
                setPanel({ kind: 'home' });
                setBubble(null);
            }
            return true;
        });
        return () => subscription.remove();
    }, [isNested, isAtShelf]);

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

    const handleCommand = (text: string) => {
        Keyboard.dismiss();
        if (!coachRoom) {
            setBubble('초불이를 부르는 중이에요. 잠시 후 다시 말해 주세요.');
            return;
        }
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        setPanel({ kind: 'thinking', text });
        setBubble('잠깐만요');
        sendMessage.mutate(
            { body: { sessionId: coachRoom.sessionId, text }, signal: controller.signal },
            {
                onSuccess: (response) => {
                    if (controller.signal.aborted) return;
                    setBubble(response.text);
                    // 카드 없이 문장만 오면(일반 질문 · AI가 답하지 못함) 말풍선으로만 답한다.
                    setPanel(
                        response.card?.type === 'TRANSFER_PROPOSAL'
                            ? { kind: 'confirm', text, card: response.card }
                            : { kind: 'home' },
                    );
                },
                onError: (error) => {
                    if (controller.signal.aborted) return;
                    setBubble(toErrorMessage(error));
                    setPanel({ kind: 'home' });
                },
            },
        );
    };

    const handleAccept = (card: TransferProposalCard) => {
        accept.mutate(
            // 카드를 보고 [옮기기]를 누른 것을 한 번 더 확인한 것으로 본다.
            { proposalId: card.proposalId, confirmed: card.requiresConfirm },
            {
                onSuccess: (response) => {
                    setBubble(response.text);
                    if (!response.card) {
                        setPanel({ kind: 'home' });
                        return;
                    }
                    addMove({
                        proposalId: card.proposalId,
                        result: response.card,
                        dailyBudget: card.dailyBudget,
                    });
                    setPanel({ kind: 'result', proposalId: card.proposalId });
                },
                onError: (error) => {
                    setBubble(toErrorMessage(error));
                    setPanel({ kind: 'home' });
                },
            },
        );
    };

    const handleUndo = (move: CoachMove) => {
        undo.mutate(move.proposalId, {
            onSuccess: (response) => {
                if (response.card) markUndone(move.proposalId, response.card);
                setUndoTarget(null);
                setBubble(response.text);
                setPanel({ kind: 'result', proposalId: move.proposalId });
            },
            onError: (error) => {
                setUndoTarget(null);
                setBubble(toErrorMessage(error));
            },
        });
    };

    const openHistory = () => {
        setPanel({ kind: 'history' });
        setBubble(null);
    };

    // 화면이 낮으면 이름표가 하단 패널에 가려지지 않도록 방을 줄인다. (선반 목록은 더 길어도 기준은 기본 패널)
    const roomAreaTop = 8;
    const visibleHeight = areaHeight - roomAreaTop - mainPanelHeight;
    const roomWidth =
        areaHeight > 0 && mainPanelHeight > 0
            ? Math.min(screenWidth, (visibleHeight * ROOM_SIZE.width) / ROOM_LABEL_SAFE_HEIGHT)
            : screenWidth;

    const hasAttention = room.attentionBlockCount > 0;
    const panelSubtitle = isAtShelf ? '블록 선반' : PANEL_SUBTITLE[panel.kind];
    const subtitle =
        panelSubtitle ??
        (hasAttention
            ? `블록 ${room.blockCount}개 중 ${room.attentionBlockCount}개가 주의예요`
            : `블록 ${room.blockCount}개 모두 안전해요`);
    const shelfMessage = hasAttention
        ? `블록 선반이에요. 주의 블록이 ${room.attentionBlockCount}개 있어요.`
        : '블록 선반이에요. 모두 안전해요.';

    const renderPanel = () => {
        if (isAtShelf) {
            return (
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
            );
        }
        switch (panel.kind) {
            case 'thinking':
                return <CoachThinkingPanel text={panel.text} onCancel={handleCancel} />;
            case 'confirm':
                return (
                    <ProposalPanel
                        text={panel.text}
                        card={panel.card}
                        isAccepting={accept.isPending}
                        onAccept={() => handleAccept(panel.card)}
                    />
                );
            case 'history':
                return <ActivityLogPanel moves={moves} onPressUndo={setUndoTarget} />;
            case 'result':
                if (resultMove) {
                    return (
                        <TransferResultPanel
                            move={resultMove}
                            onUndo={() => setUndoTarget(resultMove)}
                            onOpenHome={() => router.dismissTo('/')}
                            onOpenHistory={openHistory}
                            onCommand={handleCommand}
                        />
                    );
                }
                break;
        }
        return <AgentHomePanel room={room} onCommand={handleCommand} />;
    };

    return (
        <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <AgentRoomHeader
                subtitle={subtitle}
                isAttention={!panelSubtitle && hasAttention}
                leading={isNested ? 'back' : 'close'}
                onPressLeading={
                    isAtShelf
                        ? () => setSpot('center')
                        : isNested
                          ? handleCancel
                          : () => router.back()
                }
                onPressHistory={isNested ? undefined : openHistory}
            />

            {/* 방은 화면 너비로 그리고 아래 패널이 방 바닥을 덮는다. (시안과 같은 겹침) */}
            <View
                className="flex-1 items-center pt-2"
                onLayout={(event) => setAreaHeight(event.nativeEvent.layout.height)}
            >
                <RoomScene
                    width={roomWidth}
                    spot={spot}
                    mood={mood}
                    offline={offline}
                    halo="healthy"
                    labels={getObjectLabels(room)}
                    shelfMessage={shelfMessage}
                    message={bubble ?? undefined}
                    onPressObject={handlePressObject}
                />

                {__DEV__ && isHomePanel && !bubble && (
                    <MoodDevChips mood={offline ? 'OFFLINE' : mood} onChangeMood={setDevMood} />
                )}

                <View
                    className="absolute bottom-0 left-0 right-0 rounded-t-24 bg-surface-app px-5 pt-5"
                    style={{ paddingBottom: insets.bottom + 16 }}
                    onLayout={(event) => {
                        // 방 크기는 기본 패널 기준으로 정한다. (다른 패널은 방을 덮는다)
                        if (isHomePanel) setMainPanelHeight(event.nativeEvent.layout.height);
                    }}
                >
                    {/* 확인 카드처럼 긴 패널도 헤더 아래에서 스크롤된다. */}
                    <ScrollView
                        bounces={false}
                        keyboardShouldPersistTaps="handled"
                        style={{ maxHeight: areaHeight > 0 ? areaHeight - 24 : undefined }}
                    >
                        {renderPanel()}
                    </ScrollView>
                </View>
            </View>

            <UndoProposalSheet
                move={undoTarget}
                isUndoing={undo.isPending}
                onClose={() => setUndoTarget(null)}
                onConfirm={handleUndo}
            />
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

type DevMood = AgentMoodCode | 'OFFLINE';
const DEV_MOODS: DevMood[] = ['HAPPY', 'PROUD', 'WORRIED', 'SAD', 'ALERT', 'OFFLINE'];

/** 개발 빌드에서만: 초불이 기분 6가지를 눌러 바꿔 본다. */
function MoodDevChips({
    mood,
    onChangeMood,
}: {
    mood: DevMood;
    onChangeMood: (mood: DevMood) => void;
}) {
    const chip = (label: string, isActive: boolean, onPress: () => void) => (
        <Pressable
            key={label}
            onPress={onPress}
            className={`rounded-full px-2 py-1 ${isActive ? 'bg-white' : 'bg-white/20'}`}
        >
            <AppText className={`text-12 ${isActive ? 'text-ink' : 'text-white'}`}>{label}</AppText>
        </Pressable>
    );
    return (
        <View className="absolute left-2 right-2 top-2 flex-row flex-wrap gap-1">
            {DEV_MOODS.map((item) => chip(item, item === mood, () => onChangeMood(item)))}
        </View>
    );
}
