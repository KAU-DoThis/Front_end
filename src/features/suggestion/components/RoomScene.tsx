import { useEffect } from 'react';
import { Image, View } from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    FadeOut,
    ReduceMotion,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Ellipse, RadialGradient, Rect, Stop } from 'react-native-svg';

import { withAlpha } from '@/lib/color';
import { Mascot, type MascotPose } from '@/shared/components/ui/Mascot';
import { colors } from '@/styles/tokens';

import {
    CHARACTER_BOX,
    CHARACTER_PARTS,
    CHARACTER_SPOTS,
    OBJECT_SPOTS,
    ROOM_SIZE,
    SHELF_BUBBLE,
    SHELF_RING,
    type RoomObject,
} from './roomLayout';
import { RoomLabel } from './RoomLabel';
import { SpeechBubble } from './SpeechBubble';

const ROOM_IMAGE = require('@/assets/images/agent/agent-room.png');

/** 시트 열림과 같은 곡선 (350ms) — 초불이가 물건 앞으로 걸어간다. */
const MOVE_TIMING = {
    duration: 350,
    easing: Easing.bezier(0.32, 0.72, 0, 1),
    reduceMotion: ReduceMotion.System,
} as const;

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
    pose: MascotPose;
    halo: keyof typeof HALO_COLOR;
    labels: RoomObjectLabel[];
    /** 선반 앞에 섰을 때 말풍선 */
    shelfMessage?: string;
    onPressObject: (object: RoomObject) => void;
}

/**
 * 방 그림 + 물건 이름표 + 초불이
 * 위치는 방 크기에 비례해 계산하므로 className 대신 style로 준다.
 */
export function RoomScene({
    width,
    spot,
    pose,
    halo,
    labels,
    shelfMessage,
    onPressObject,
}: RoomSceneProps) {
    const unit = width / ROOM_SIZE.width;
    const isAtShelf = spot === 'shelf';

    const progress = useSharedValue(isAtShelf ? 1 : 0);
    useEffect(() => {
        progress.set(withTiming(isAtShelf ? 1 : 0, MOVE_TIMING));
    }, [isAtShelf, progress]);

    const characterStyle = useAnimatedStyle(() => {
        const from = CHARACTER_SPOTS.center;
        const to = CHARACTER_SPOTS.shelf;
        const t = progress.get();
        return {
            left: (from.x + (to.x - from.x) * t) * unit,
            top: (from.y + (to.y - from.y) * t) * unit,
            transform: [{ scale: from.scale + (to.scale - from.scale) * t }],
        };
    });

    const box = CHARACTER_BOX * unit;
    const part = (key: keyof typeof CHARACTER_PARTS) => ({
        left: CHARACTER_PARTS[key].x * unit,
        top: CHARACTER_PARTS[key].y * unit,
        width: CHARACTER_PARTS[key].width * unit,
        height: CHARACTER_PARTS[key].height * unit,
    });

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
                <Svg style={[{ position: 'absolute' }, part('shadow')]}>
                    <Defs>
                        <RadialGradient id="shadow" cx="50%" cy="50%" r="50%">
                            <Stop offset="0" stopColor={colors.primary[900]} stopOpacity={0.3} />
                            <Stop offset="1" stopColor={colors.primary[900]} stopOpacity={0} />
                        </RadialGradient>
                    </Defs>
                    <Ellipse cx="50%" cy="50%" rx="50%" ry="50%" fill="url(#shadow)" />
                </Svg>
                <View style={[{ position: 'absolute' }, part('character')]}>
                    <Mascot pose={pose} className="h-full w-full" />
                </View>
            </Animated.View>

            {!isAtShelf &&
                labels.map((item) => (
                    <View
                        key={item.object}
                        style={{
                            position: 'absolute',
                            left: OBJECT_SPOTS[item.object].x * unit,
                            top: OBJECT_SPOTS[item.object].y * unit,
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
