import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
    Pressable,
    View,
    type LayoutChangeEvent,
    type StyleProp,
    type ViewStyle,
} from 'react-native';
import Animated, {
    Easing,
    cancelAnimation,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { cn } from '@/lib/cn';
import { shade, tint, withAlpha } from '@/lib/color';
import { formatWon } from '@/lib/format';
import { AmountText } from '@/shared/components/ui/AmountText';
import { AppText } from '@/shared/components/ui/AppText';
import { StatusTag, type Status } from '@/shared/components/ui/StatusTag';
import { useReduceMotion } from '@/shared/hooks/useReduceMotion';
import { colors } from '@/styles/tokens';

/** 블록 고정 색 (tokens.js block.{i~l}) */
export type BlockColor = keyof typeof colors.block;

/** 크기 단계: lg 대 · md 중 · sm 소(반 폭) · xs 띠 */
export type BeakerSize = 'lg' | 'md' | 'sm' | 'xs';

/** 크기 단계별 높이 (시안 01 홈 기준). 너비는 부모가 정한다. */
export const BEAKER_HEIGHT: Record<BeakerSize, number> = {
    lg: 302,
    md: 116,
    sm: 116,
    xs: 54,
};

interface BlockBeakerProps {
    name: string;
    /** 블록 잔액 (원) */
    amount: number;
    color: BlockColor;
    /** 상태에 따라 블록 색의 채도가 빠진다. */
    status: Status;
    /** 물 높이 0~100 (서버 값 그대로: 사용형 남은 비율 · 목표형 달성률) */
    fillRate: number;
    size: BeakerSize;
    /** 이름 아래 보조 문구 (xs에서는 표시하지 않는다) */
    caption?: string;
    /** 자금 이동 드래그 중 상태칩 자리에 보여줄 표시 (보내는 중 · 받는 블록, 03-1) */
    dragLabel?: string;
    onPress?: () => void;
    className?: string;
    style?: StyleProp<ViewStyle>;
}

/** 크기 단계별 글자·여백 (시안 블록 · 저축/생활비/월세/여행) */
const SIZE_STYLE = {
    lg: { container: 'p-4', name: 'text-17', amount: 'text-20' },
    md: { container: 'p-3', name: 'text-15', amount: 'text-17' },
    // 반 폭이라 시안처럼 오른쪽 여백을 줄여 금액 자리를 확보한다.
    sm: { container: 'py-3 pl-3 pr-1.5', name: 'text-13', amount: 'text-15' },
    xs: { container: 'px-3 py-2', name: 'text-13', amount: 'text-15' },
} as const;

/**
 * 비커 블록: 블록 색 22% 바탕 위에 남은 비율만큼 물이 차 있다.
 * 물결은 좌우로 흐르고, 물 높이가 바뀌면 수위가 부드럽게 오르내린다. (동작 줄이기 설정이면 멈춤)
 */
export function BlockBeaker({
    name,
    amount,
    color,
    status,
    fillRate,
    size,
    caption,
    dragLabel,
    onPress,
    className,
    style,
}: BlockBeakerProps) {
    const sizeStyle = SIZE_STYLE[size];
    const tag = dragLabel ? <DragTag label={dragLabel} /> : <StatusTag status={status} />;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${name} 블록, ${formatWon(amount)}`}
            disabled={!onPress}
            onPress={onPress}
            className={cn('active:opacity-80', className)}
            style={[{ height: BEAKER_HEIGHT[size] }, style]}
        >
            <BeakerSurface
                color={color}
                status={status}
                fillRate={fillRate}
                wave={size === 'xs' ? 'strip' : 'block'}
                className="flex-1"
                contentClassName={cn('justify-between', sizeStyle.container)}
            >
                {size === 'sm' ? (
                    <View className="items-start">
                        <AppText numberOfLines={1} className="font-bold text-13">
                            {name}
                        </AppText>
                        {tag}
                    </View>
                ) : (
                    <View className="flex-row items-center justify-between gap-1">
                        <AppText
                            numberOfLines={1}
                            className={cn('shrink font-bold', sizeStyle.name)}
                        >
                            {name}
                        </AppText>
                        {tag}
                    </View>
                )}
                <View>
                    {caption && size !== 'xs' && (
                        <AppText numberOfLines={1} className="font-semibold text-12">
                            {caption}
                        </AppText>
                    )}
                    <AmountText
                        amount={amount}
                        showUnit={false}
                        numberOfLines={1}
                        // 자리가 모자라면 글자를 줄여서라도 금액을 다 보여준다.
                        adjustsFontSizeToFit
                        className={sizeStyle.amount}
                    />
                </View>
            </BeakerSurface>
        </Pressable>
    );
}

/** 드래그 중 표시 칩: 상태칩과 같은 크기, 진한 바탕 */
function DragTag({ label }: { label: string }) {
    return (
        <View className="self-start rounded-8 bg-primary-900 px-2 py-0.75">
            <AppText className="font-bold text-11 text-white">{label}</AppText>
        </View>
    );
}

/** 블록 물 색 (상태가 나빠질수록 채도가 빠진다) — 물방울처럼 블록 밖에서 같은 색을 쓸 때 */
export function getWaterColor(color: BlockColor, status: Status) {
    return colors.block[color][STATUS_KEY[status]];
}

/** 물결 모양: block 홈 블록 · strip 띠 블록(한 겹, 납작) · card 블록 상세 큰 카드(너비 350 기준) */
type WaveKind = 'block' | 'strip' | 'card';

interface BeakerSurfaceProps {
    color: BlockColor;
    status: Status;
    /** 물 높이 0~100 */
    fillRate: number;
    wave: WaveKind;
    /** 모서리: 16 홈 블록 · 24 블록 상세 카드 */
    radius?: 16 | 24;
    /** 겉 크기 (flex-1, h-50 등) */
    className?: string;
    /** 물 위에 올라가는 내용 영역 */
    contentClassName?: string;
    children?: ReactNode;
}

/**
 * 비커 바탕: 블록 색 22% 면 + 남은 비율만큼 찬 물 + 유리 테두리 + 그림자.
 * 홈 블록(BlockBeaker)과 블록 상세 카드가 같이 쓴다.
 */
export function BeakerSurface({
    color,
    status,
    fillRate,
    wave,
    radius = 16,
    className,
    contentClassName,
    children,
}: BeakerSurfaceProps) {
    const waterColor = colors.block[color][STATUS_KEY[status]];
    // 테두리·그림자는 시안처럼 블록 색을 조금 어둡게 쓴다.
    const edgeColor = shade(waterColor, 0.88);
    const rate = Math.min(100, Math.max(0, fillRate));
    const radiusClass = RADIUS_CLASS[radius];

    return (
        <View
            className={cn(radiusClass, className)}
            style={{ boxShadow: `0px 6px 14px 0px ${withAlpha(edgeColor, 0.22)}` }}
        >
            <View
                className={cn('flex-1 overflow-hidden', radiusClass)}
                style={{ backgroundColor: withAlpha(waterColor, 0.22) }}
            >
                <Water color={waterColor} rate={rate} wave={wave} />
                {/* 유리 테두리: 위는 밝게, 아래는 어둡게 1px */}
                <View
                    pointerEvents="none"
                    className={cn('absolute inset-0 border', radiusClass)}
                    style={{
                        borderColor: withAlpha(edgeColor, 0.12),
                        boxShadow: `inset 0px 1px 0px 0px ${withAlpha(tint(waterColor, 0.7), 0.95)}, inset 0px -1px 0px 0px ${withAlpha(edgeColor, 0.45)}`,
                    }}
                />
                <View className={cn('flex-1', contentClassName)}>{children}</View>
            </View>
        </View>
    );
}

const STATUS_KEY = { SAFE: 'safe', CAUTION: 'caution', DANGER: 'danger' } as const;

const RADIUS_CLASS = { 16: 'rounded-16', 24: 'rounded-24' } as const;

interface WaterProps {
    color: string;
    /** 0~100 */
    rate: number;
    wave: WaveKind;
}

function Water({ color, rate, wave }: WaterProps) {
    const isReducedMotion = useReduceMotion();
    const [width, setWidth] = useState(0);
    const level = useSharedValue(rate);
    const isMidLevel = rate > 0 && rate < 100;
    // 수위가 다 오르내린 값. 0%·100%로 가는 중에는 물결을 남겨 두고, 도착하면 숨긴다.
    const [settledRate, setSettledRate] = useState(rate);
    const isMoving = !isReducedMotion && settledRate !== rate;
    // 물이 없거나 가득 차면 물결을 그리지 않는다. (높이 0인 물 위로 물결만 솟아 보임)
    const hasWave = width > 0 && (isMidLevel || isMoving);
    const lineColor = withAlpha(colors.white, 0.8);

    // 물 높이가 바뀌면(이동·입금 후 다시 불러올 때) 수위가 부드럽게 오르내린다.
    useEffect(() => {
        if (isReducedMotion) {
            cancelAnimation(level);
            level.value = rate;
            return;
        }
        level.value = withTiming(
            rate,
            { duration: 600, easing: Easing.out(Easing.cubic) },
            (finished) => {
                if (finished) scheduleOnRN(setSettledRate, rate);
            },
        );
    }, [isReducedMotion, level, rate]);

    const levelStyle = useAnimatedStyle(() => ({ height: `${level.value}%` }));

    const handleLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: color },
                levelStyle,
            ]}
            onLayout={handleLayout}
        >
            {/* 가득 찬 블록은 물결 없이 색으로만 채운다. (시안 월세 · 저금통) */}
            {hasWave &&
                WAVES[wave].map((spec, index) => (
                    <MovingWave
                        key={index}
                        width={width}
                        spec={spec}
                        color={color}
                        lineColor={lineColor}
                        isStatic={isReducedMotion}
                    />
                ))}
        </Animated.View>
    );
}

/**
 * 물결 한 겹. 시안 물결(wave/back · wave)과 같은 높이·진폭의 반복 곡선을 한 파장만큼 더 길게 그려 두고,
 * 한 파장씩 옆으로 밀어 끊김 없이 흐르게 한다. (UI 스레드 애니메이션)
 */
interface WaveSpec {
    /** 시안 기준 너비 (블록 171 · 큰 카드 350). 실제 너비에 맞춰 가로로 늘인다. */
    viewWidth: number;
    height: number;
    /** 물 위로 올라오는 위치 (px) */
    top: number;
    /** 물결 가운데 높이 · 진폭 · 반 파장 (시안 단위) */
    mid: number;
    amplitude: number;
    halfWave: number;
    /** true면 처음에 위로 솟는다. */
    startsUp: boolean;
    /** 한 파장 흐르는 시간. 뒤 물결은 더 느리게, 반대 방향으로 흐른다. */
    durationMs: number;
    direction: 1 | -1;
    opacity?: number;
    /** 앞 물결 위 흰 선 두께 (없으면 선 없음) */
    lineWidth?: number;
}

const WAVES: Record<WaveKind, WaveSpec[]> = {
    block: [
        {
            viewWidth: 171,
            height: 14,
            top: -13,
            mid: 5.83,
            amplitude: 7,
            halfWave: 85.5,
            startsUp: false,
            durationMs: 6000,
            direction: -1,
            opacity: 0.45,
        },
        {
            viewWidth: 171,
            height: 11,
            top: -10,
            mid: 5.5,
            amplitude: 5.5,
            halfWave: 64.125,
            startsUp: true,
            durationMs: 3800,
            direction: 1,
            lineWidth: 1.71,
        },
    ],
    // 띠(xs) 블록은 낮아서 물결이 한 겹이고 더 납작하다.
    strip: [
        {
            viewWidth: 171,
            height: 8,
            top: -7,
            mid: 4,
            amplitude: 4,
            halfWave: 64.125,
            startsUp: true,
            durationMs: 3800,
            direction: 1,
            lineWidth: 1.46,
        },
    ],
    // 큰 카드(블록 상세)는 흰 선 없음
    card: [
        {
            viewWidth: 350,
            height: 16,
            top: -15,
            mid: 6.67,
            amplitude: 8,
            halfWave: 175,
            startsUp: false,
            durationMs: 7000,
            direction: -1,
            opacity: 0.45,
        },
        {
            viewWidth: 350,
            height: 13,
            top: -12,
            mid: 6.5,
            amplitude: 6.5,
            halfWave: 131.25,
            startsUp: true,
            durationMs: 4500,
            direction: 1,
        },
    ],
};

/** 0부터 length까지 이어지는 물결 선 (반 파장마다 위·아래로 번갈아 굽는다) */
function buildWaveLine({ mid, amplitude, halfWave, startsUp }: WaveSpec, length: number) {
    let d = `M0 ${mid}`;
    let isUp = startsUp;
    for (let x = 0; x < length; x += halfWave) {
        const peak = isUp ? mid - amplitude : mid + amplitude;
        d += ` C${x + halfWave / 3} ${peak} ${x + (halfWave * 2) / 3} ${peak} ${x + halfWave} ${mid}`;
        isUp = !isUp;
    }
    return d;
}

interface MovingWaveProps {
    /** 물 너비 (px) */
    width: number;
    spec: WaveSpec;
    color: string;
    lineColor: string;
    /** 동작 줄이기 설정이면 멈춘 물결 */
    isStatic: boolean;
}

function MovingWave({ width, spec, color, lineColor, isStatic }: MovingWaveProps) {
    const progress = useSharedValue(0);
    const wavelength = spec.halfWave * 2;
    const length = spec.viewWidth + wavelength;
    const scale = width / spec.viewWidth;
    const shift = wavelength * scale;
    const line = useMemo(() => buildWaveLine(spec, length), [spec, length]);

    useEffect(() => {
        if (isStatic) {
            cancelAnimation(progress);
            progress.value = 0;
            return;
        }
        progress.value = 0;
        progress.value = withRepeat(
            withTiming(1, { duration: spec.durationMs, easing: Easing.linear }),
            -1,
        );
        return () => cancelAnimation(progress);
    }, [isStatic, progress, spec.durationMs]);

    const moveStyle = useAnimatedStyle(() => ({
        transform: [
            {
                translateX:
                    spec.direction === 1 ? -progress.value * shift : (progress.value - 1) * shift,
            },
        ],
    }));

    return (
        <Animated.View
            style={[
                { position: 'absolute', top: spec.top, left: 0, width: length * scale },
                moveStyle,
            ]}
        >
            <Svg
                width={length * scale}
                height={spec.height}
                viewBox={`0 0 ${length} ${spec.height}`}
                preserveAspectRatio="none"
            >
                <Path d={`${line} V${spec.height} H0 Z`} fill={color} opacity={spec.opacity ?? 1} />
                {spec.lineWidth !== undefined && (
                    <Path
                        d={line}
                        fill="none"
                        stroke={lineColor}
                        strokeWidth={spec.lineWidth}
                        vectorEffect="non-scaling-stroke"
                    />
                )}
            </Svg>
        </Animated.View>
    );
}
