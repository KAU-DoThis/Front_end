import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    FadeOut,
    ReduceMotion,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Ellipse, RadialGradient, Rect, Stop } from 'react-native-svg';

import type { AgentMoodCode } from '@/features/suggestion/types/agentRoom';

import { withAlpha } from '@/lib/color';
import { colors } from '@/styles/tokens';

import {
    CENTER_BUBBLE,
    CHARACTER_BOX,
    CHARACTER_SPRITE,
    CHARACTER_FEET,
    CHARACTER_SHADOW,
    CHARACTER_SPOTS,
    LABEL_EDGE_INSET,
    OBJECT_SPOTS,
    ROOM_SIZE,
    SHELF_BUBBLE,
    SHELF_RING,
    WANDER_AREA,
    type RoomObject,
} from './roomLayout';
import { MascotSprite } from './MascotSprite';
import { RoomLabel } from './RoomLabel';
import { SpeechBubble } from './SpeechBubble';

const ROOM_IMAGE = require('@/assets/images/agent/agent-room.png');

/** 시트 열림과 같은 곡선 (350ms) — 초불이가 물건 앞으로 걸어간다. */
const MOVE_TIMING = {
    duration: 350,
    easing: Easing.bezier(0.32, 0.72, 0, 1),
    reduceMotion: ReduceMotion.System,
} as const;

/** 돌아다니기: 초당 이동 거리(방 좌표), 쉬는 시간, 통통 튀는 한 번(올라갔다 내려오기의 절반) */
const WANDER_SPEED = 30;
const WANDER_PAUSE_MS = { min: 2000, max: 5000 } as const;
const HOP_HALF_MS = 160;
const HOP_HEIGHT = 3;

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

/** 러그 마름모 안 아무 발 위치. 안쪽(위)일수록 조금 작게 그린다. */
function randomWanderSpot() {
    const { cx, cy, rx, ry, depthScale } = WANDER_AREA;
    // 마름모 |dx|/rx + |dy|/ry <= 1 안에서 고른다.
    let dx: number;
    let dy: number;
    do {
        dx = randomBetween(-1, 1);
        dy = randomBetween(-1, 1);
    } while (Math.abs(dx) + Math.abs(dy) > 1);
    const feetY = cy + dy * ry;
    const scale = 1 + dy * depthScale;
    return {
        x: cx + dx * rx - CHARACTER_FEET.x * scale,
        y: feetY - CHARACTER_FEET.y * scale,
        scale,
    };
}

/** 후광 색은 상태 색 (건강 = 연두, 주의 = 노랑) */
const HALO_COLOR = { healthy: colors.block.s.safe, caution: colors.caution.DEFAULT } as const;

export interface RoomObjectLabel {
    object: RoomObject;
    label: string;
    accessibilityHint: string;
    hasDot?: boolean;
}

interface RoomSceneProps {
    /** 방 그림 너비 (px). 높이는 그림 비율로 정해진다. */
    width: number;
    /** center: 방 가운데 · shelf: 선반 앞 (1-1) */
    spot: keyof typeof CHARACTER_SPOTS;
    mood: AgentMoodCode;
    /** AI가 꺼져 있으면 자는 초불이 */
    offline: boolean;
    halo: keyof typeof HALO_COLOR;
    labels: RoomObjectLabel[];
    /** 선반 앞에 섰을 때 말풍선 */
    shelfMessage?: string;
    /** 방 가운데에서 초불이가 하는 말 (대화 응답). 있으면 이름표를 숨기고 제자리에 선다. */
    message?: string;
    onPressObject: (object: RoomObject) => void;
}

/**
 * 방 그림 + 물건 이름표 + 초불이
 * 위치는 방 크기에 비례해 계산하므로 className 대신 style로 준다.
 */
export function RoomScene({
    width,
    spot,
    mood,
    offline,
    halo,
    labels,
    shelfMessage,
    message,
    onPressObject,
}: RoomSceneProps) {
    const unit = width / ROOM_SIZE.width;
    const isAtShelf = spot === 'shelf';
    const centerMessage = isAtShelf ? undefined : message;
    // 글자를 키우거나 화면이 좁아도 이름표가 방 밖으로 나가지 않게 실제 너비를 재서 안쪽으로 당긴다.
    const [labelWidths, setLabelWidths] = useState<Partial<Record<RoomObject, number>>>({});
    const getLabelLeft = (object: RoomObject) => {
        const left = OBJECT_SPOTS[object].x * unit;
        const labelWidth = labelWidths[object] ?? 0;
        return Math.max(LABEL_EDGE_INSET, Math.min(left, width - LABEL_EDGE_INSET - labelWidth));
    };

    // 초불이 묶음 위치(방 좌표)와 크기. 선반 앞·방 가운데로 가거나, 가운데에 있을 땐 러그 위를 돌아다닌다.
    const start = CHARACTER_SPOTS[spot];
    const posX = useSharedValue<number>(start.x);
    const posY = useSharedValue<number>(start.y);
    const posScale = useSharedValue<number>(start.scale);
    const hop = useSharedValue(0);
    /** 1: 원래 방향(오른쪽) · -1: 왼쪽으로 갈 때 좌우 뒤집기 */
    const facing = useSharedValue(1);
    const isReducedMotion = useReducedMotion();
    // 자고 있거나 동작 줄이기를 켰으면 제자리에 있는다.
    const canWander = !isAtShelf && !centerMessage && !offline && !isReducedMotion;

    useEffect(() => {
        const target = CHARACTER_SPOTS[spot];
        posX.set(withTiming(target.x, MOVE_TIMING));
        posY.set(withTiming(target.y, MOVE_TIMING));
        posScale.set(withTiming(target.scale, MOVE_TIMING));
        hop.set(withTiming(0, { duration: HOP_HALF_MS }));
        facing.set(1);
        if (!canWander) return;

        let timer: ReturnType<typeof setTimeout>;
        const walk = () => {
            const next = randomWanderSpot();
            const distance = Math.hypot(next.x - posX.get(), next.y - posY.get());
            const duration = (distance / WANDER_SPEED) * 1000;
            const easing = Easing.inOut(Easing.quad);
            facing.set(next.x < posX.get() ? -1 : 1);
            posX.set(withTiming(next.x, { duration, easing }));
            posY.set(withTiming(next.y, { duration, easing }));
            posScale.set(withTiming(next.scale, { duration, easing }));
            // 걷는 시트가 없어서 이동하는 동안 통통 튀게 한다. (짝수 번이라 바닥에서 끝난다)
            const hops = Math.max(2, Math.round(duration / HOP_HALF_MS / 2) * 2);
            hop.set(withRepeat(withTiming(1, { duration: HOP_HALF_MS }), hops, true));
            timer = setTimeout(
                walk,
                duration + randomBetween(WANDER_PAUSE_MS.min, WANDER_PAUSE_MS.max),
            );
        };
        timer = setTimeout(walk, randomBetween(WANDER_PAUSE_MS.min, WANDER_PAUSE_MS.max));
        return () => clearTimeout(timer);
    }, [spot, canWander, posX, posY, posScale, hop, facing]);

    const characterStyle = useAnimatedStyle(() => ({
        left: posX.get() * unit,
        top: posY.get() * unit,
        transform: [{ scale: posScale.get() }],
    }));

    // 통통 튀어 떠오르면 바닥 그림자가 조금 작아진다.
    const shadowStyle = useAnimatedStyle(() => ({
        transform: [{ scale: 1 - hop.get() * 0.15 }],
    }));

    const spriteMotionStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: -hop.get() * HOP_HEIGHT * unit }, { scaleX: facing.get() }],
    }));

    const box = CHARACTER_BOX * unit;

    return (
        <View style={{ width, height: ROOM_SIZE.height * unit }}>
            <Image
                source={ROOM_IMAGE}
                className="absolute inset-0 h-full w-full"
                resizeMode="contain"
                accessibilityIgnoresInvertColors
            />

            {isAtShelf && (
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(150)}
                    className="rounded-full border-2 border-primary-300"
                    style={{
                        position: 'absolute',
                        left: SHELF_RING.x * unit,
                        top: SHELF_RING.y * unit,
                        width: SHELF_RING.size * unit,
                        height: SHELF_RING.size * unit,
                        boxShadow: `0px 0px 0px 6px ${withAlpha(colors.primary[300], 0.25)}`,
                    }}
                />
            )}

            {/* 초불이 묶음: 크기를 줄일 때 왼쪽 위를 기준으로 줄인다. */}
            <Animated.View
                pointerEvents="none"
                style={[
                    { position: 'absolute', width: box, height: box, transformOrigin: 'left top' },
                    characterStyle,
                ]}
            >
                <Svg width={box} height={box} style={{ position: 'absolute' }}>
                    <Defs>
                        <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
                            <Stop offset="0" stopColor={HALO_COLOR[halo]} stopOpacity={0.55} />
                            <Stop offset="1" stopColor={HALO_COLOR[halo]} stopOpacity={0} />
                        </RadialGradient>
                    </Defs>
                    <Rect width={box} height={box} fill="url(#halo)" />
                </Svg>
                <Animated.View
                    style={[
                        {
                            position: 'absolute',
                            left: CHARACTER_SHADOW.x * unit,
                            top: CHARACTER_SHADOW.y * unit,
                            width: CHARACTER_SHADOW.width * unit,
                            height: CHARACTER_SHADOW.height * unit,
                        },
                        shadowStyle,
                    ]}
                >
                    <Svg width="100%" height="100%">
                        <Defs>
                            <RadialGradient id="shadow" cx="50%" cy="50%" r="50%">
                                <Stop
                                    offset="0"
                                    stopColor={colors.primary[900]}
                                    stopOpacity={0.3}
                                />
                                <Stop offset="1" stopColor={colors.primary[900]} stopOpacity={0} />
                            </RadialGradient>
                        </Defs>
                        <Ellipse cx="50%" cy="50%" rx="50%" ry="50%" fill="url(#shadow)" />
                    </Svg>
                </Animated.View>
                <Animated.View
                    style={[
                        {
                            position: 'absolute',
                            left: CHARACTER_SPRITE.x * unit,
                            top: CHARACTER_SPRITE.y * unit,
                        },
                        spriteMotionStyle,
                    ]}
                >
                    <MascotSprite
                        mood={mood}
                        offline={offline}
                        size={CHARACTER_SPRITE.size * unit}
                    />
                </Animated.View>
            </Animated.View>

            {!isAtShelf &&
                !centerMessage &&
                labels.map((item) => (
                    <View
                        key={item.object}
                        style={{
                            position: 'absolute',
                            left: getLabelLeft(item.object),
                            top: OBJECT_SPOTS[item.object].y * unit,
                        }}
                        onLayout={(event) => {
                            const measured = event.nativeEvent.layout.width;
                            setLabelWidths((prev) =>
                                prev[item.object] === measured
                                    ? prev
                                    : { ...prev, [item.object]: measured },
                            );
                        }}
                    >
                        <Animated.View
                            entering={FadeIn.duration(200)}
                            exiting={FadeOut.duration(150)}
                        >
                            <RoomLabel
                                label={item.label}
                                hasDot={item.hasDot}
                                accessibilityHint={item.accessibilityHint}
                                onPress={() => onPressObject(item.object)}
                            />
                        </Animated.View>
                    </View>
                ))}

            {centerMessage && (
                <SpeechBubble
                    // 문장이 바뀌면 다시 나타나게 한다.
                    key={centerMessage}
                    message={centerMessage}
                    tailLeft={CENTER_BUBBLE.tailLeft}
                    style={{
                        position: 'absolute',
                        left: CENTER_BUBBLE.x * unit,
                        top: CENTER_BUBBLE.y * unit,
                        width: Math.min(CENTER_BUBBLE.width, width - CENTER_BUBBLE.x * unit - 16),
                    }}
                />
            )}

            {isAtShelf && shelfMessage && (
                <SpeechBubble
                    message={shelfMessage}
                    tailLeft={SHELF_BUBBLE.tailLeft}
                    style={{
                        position: 'absolute',
                        left: SHELF_BUBBLE.x * unit,
                        top: SHELF_BUBBLE.y * unit,
                        width: Math.min(SHELF_BUBBLE.width, width - SHELF_BUBBLE.x * unit - 16),
                    }}
                />
            )}
        </View>
    );
}
