import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

import type { AgentMoodCode } from '@/features/suggestion/types/agentRoom';

/**
 * 스프라이트 시트 (fintris-sprites v3 sheets/*@2x, 프레임 512px, 8열)
 * 표정은 시트에 그려져 있어서 시트마다 정해져 있다. (sprites.json 값을 옮김)
 */
const SHEETS = {
    idle_healthy: {
        source: require('@/assets/images/agent/sprites/idle_healthy.png'),
        frames: 24,
        fps: 12,
    },
    sway_healthy: {
        source: require('@/assets/images/agent/sprites/sway_healthy.png'),
        frames: 16,
        fps: 12,
    },
    jump_healthy: {
        source: require('@/assets/images/agent/sprites/jump_healthy.png'),
        frames: 14,
        fps: 16,
    },
    idle_caution: {
        source: require('@/assets/images/agent/sprites/idle_caution.png'),
        frames: 24,
        fps: 12,
    },
    idle_danger: {
        source: require('@/assets/images/agent/sprites/idle_danger.png'),
        frames: 24,
        fps: 12,
    },
    shake_alert: {
        source: require('@/assets/images/agent/sprites/shake_alert.png'),
        frames: 10,
        fps: 16,
    },
    idle_alert: {
        source: require('@/assets/images/agent/sprites/idle_alert.png'),
        frames: 24,
        fps: 12,
    },
};
const SHEET_COLUMNS = 8;

type SheetName = keyof typeof SHEETS;

/**
 * 기분별 재생 순서
 * - intro: 기분이 바뀌면 한 번 (점프·흔들림)
 * - loop: 대기 루프
 * - extra: loop를 extraEvery번 돈 뒤 한 번 끼워 넣는다 (가끔 갸웃)
 */
const MOOD_PLAN: Record<
    AgentMoodCode,
    { intro?: SheetName; loop: SheetName; extra?: SheetName; extraEvery?: number }
> = {
    HAPPY: { loop: 'idle_healthy', extra: 'sway_healthy', extraEvery: 3 },
    PROUD: { intro: 'jump_healthy', loop: 'sway_healthy' },
    WORRIED: { loop: 'idle_caution' },
    SAD: { loop: 'idle_danger' },
    ALERT: { intro: 'shake_alert', loop: 'idle_alert' },
};

const EYES_CLOSED = require('@/assets/images/agent/sprites/eyes_closed.png');

/** 발바닥 중앙 (모든 그림·프레임 공통). 숨쉬기를 이 점 기준으로 한다. */
const FEET_ORIGIN = '50% 93.36%';

interface Playback {
    mood: AgentMoodCode;
    sheet: SheetName;
    frame: number;
    loops: number;
}

const startOf = (mood: AgentMoodCode): Playback => ({
    mood,
    sheet: MOOD_PLAN[mood].intro ?? MOOD_PLAN[mood].loop,
    frame: 0,
    loops: 0,
});

function nextFrame(prev: Playback): Playback {
    if (prev.frame + 1 < SHEETS[prev.sheet].frames) {
        return { ...prev, frame: prev.frame + 1 };
    }
    const plan = MOOD_PLAN[prev.mood];
    if (prev.sheet !== plan.loop) {
        // intro·extra가 끝나면 대기 루프로 돌아간다.
        return { ...prev, sheet: plan.loop, frame: 0 };
    }
    const loops = prev.loops + 1;
    if (plan.extra && plan.extraEvery && loops % plan.extraEvery === 0) {
        return { ...prev, sheet: plan.extra, frame: 0, loops };
    }
    return { ...prev, frame: 0, loops };
}

interface MascotSpriteProps {
    mood: AgentMoodCode;
    /** AI가 꺼져 있으면 자는 모습 */
    offline: boolean;
    /** 프레임 한 변 (px). 캐릭터는 이 안에서 발바닥이 y 93.36%에 오게 그려져 있다. */
    size: number;
}

/** 초불이의 방 초불이. 그림자는 그림에서 지웠고 방이 바닥에 따로 그린다. */
export function MascotSprite({ mood, offline, size }: MascotSpriteProps) {
    if (offline) {
        return <SleepingStill size={size} />;
    }
    return <SheetPlayer mood={mood} size={size} />;
}

function SheetPlayer({ mood, size }: { mood: AgentMoodCode; size: number }) {
    const isReducedMotion = useReducedMotion();
    const [playback, setPlayback] = useState(() => startOf(mood));
    // 기분이 바뀌면 처음(intro)부터 다시 재생한다.
    if (playback.mood !== mood) {
        setPlayback(startOf(mood));
    }

    const { sheet, frame } = playback;
    useEffect(() => {
        if (isReducedMotion) return;
        const timer = setTimeout(() => setPlayback(nextFrame), 1000 / SHEETS[sheet].fps);
        return () => clearTimeout(timer);
    }, [sheet, frame, isReducedMotion]);

    // 다음에 올 시트도 미리 띄워 둔다. (처음 그릴 때 한 프레임 비는 깜빡임 방지)
    const plan = MOOD_PLAN[mood];
    const mounted = [...new Set([plan.intro, plan.loop, plan.extra])].filter(
        (name): name is SheetName => name !== undefined,
    );

    return (
        <View style={{ width: size, height: size, overflow: 'hidden' }}>
            {mounted.map((name) => {
                const isCurrent = name === sheet;
                const shownFrame = isCurrent ? frame : 0;
                const rows = Math.ceil(SHEETS[name].frames / SHEET_COLUMNS);
                return (
                    <Image
                        key={name}
                        source={SHEETS[name].source}
                        fadeDuration={0}
                        accessibilityIgnoresInvertColors
                        style={{
                            position: 'absolute',
                            width: size * SHEET_COLUMNS,
                            height: size * rows,
                            left: -(shownFrame % SHEET_COLUMNS) * size,
                            top: -Math.floor(shownFrame / SHEET_COLUMNS) * size,
                            opacity: isCurrent ? 1 : 0,
                        }}
                    />
                );
            })}
        </View>
    );
}

/** 자는 초불이: 눈 감은 그림 + 발바닥 기준 숨쉬기 */
function SleepingStill({ size }: { size: number }) {
    const isReducedMotion = useReducedMotion();
    const breath = useSharedValue(0);
    useEffect(() => {
        if (isReducedMotion) return;
        breath.set(
            withRepeat(
                withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
                -1,
                true,
            ),
        );
    }, [breath, isReducedMotion]);

    const style = useAnimatedStyle(() => ({
        transform: [{ scaleX: 1 - breath.get() * 0.015 }, { scaleY: 1 + breath.get() * 0.03 }],
    }));

    return (
        <Animated.Image
            source={EYES_CLOSED}
            fadeDuration={0}
            accessibilityIgnoresInvertColors
            style={[{ width: size, height: size, transformOrigin: FEET_ORIGIN }, style]}
        />
    );
}
