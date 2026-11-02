import Animated, {
    useAnimatedProps,
    useAnimatedStyle,
    type SharedValue,
} from 'react-native-reanimated';
import Svg, { Ellipse, Path } from 'react-native-svg';

import { shade, withAlpha } from '@/lib/color';
import { colors } from '@/styles/tokens';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** 뽑아낸 직후 크기 52px (Figma '물방울 움직임' 보드 1단계) */
export const DROPLET_SIZE = 52;
const RADIUS = DROPLET_SIZE / 2;
/** 끄는 중 가장 길어질 때 전체 길이 = 지름 × 1.4 → 꼬리는 반지름 × 0.8까지 */
const MAX_TAIL = RADIUS * 0.8;
/** 꼬리·그림자가 잘리지 않을 여유 */
const PAD = 6;
/** 회전 중심(머리 중심)이 가운데에 오도록 정사각형으로 그린다. */
const BOX = (RADIUS + MAX_TAIL + PAD) * 2;
const CENTER = BOX / 2;
/** 원을 베지어 곡선 4개로 그릴 때 쓰는 상수 */
const KAPPA = 0.5523;
const SHADOW_OFFSET = 3;

/**
 * 머리는 진행 방향(+x)을 보고, 꼬리는 반대쪽(-x)으로 늘어나는 물방울 경로.
 * tail = 0이면 완전한 원, 1이면 꼬리가 가장 길다.
 */
function dropletPath(tail: number, offsetX: number, offsetY: number) {
    'worklet';
    const t = Math.min(1, Math.max(0, tail));
    const cx = CENTER + offsetX;
    const cy = CENTER + offsetY;
    const r = RADIUS;
    const k = KAPPA * r;
    const tipX = cx - r - MAX_TAIL * t;
    // 꼬리가 길수록 끝이 뾰족해진다.
    const tipK = k * (1 - 0.7 * t);
    return [
        `M ${tipX} ${cy}`,
        `C ${tipX} ${cy - tipK} ${cx - k} ${cy - r} ${cx} ${cy - r}`,
        `C ${cx + k} ${cy - r} ${cx + r} ${cy - k} ${cx + r} ${cy}`,
        `C ${cx + r} ${cy + k} ${cx + k} ${cy + r} ${cx} ${cy + r}`,
        `C ${cx - k} ${cy + r} ${tipX} ${cy + tipK} ${tipX} ${cy}`,
        'Z',
    ].join(' ');
}

interface DropletProps {
    /** 물방울 머리 중심 (레이어 기준 좌표) */
    x: SharedValue<number>;
    y: SharedValue<number>;
    /** 0 동그라미 ~ 1 꼬리 가장 김. 멈출 때 0 아래로 내려가면 옆으로 퍼진다. */
    stretch: SharedValue<number>;
    /** 진행 방향 (라디안) */
    angle: SharedValue<number>;
    opacity: SharedValue<number>;
    scale: SharedValue<number>;
    /** 보내는 블록 물 색 */
    color: string;
}

/**
 * 자금 이동 물방울 (Figma '물방울 움직임' 1~3단계)
 * 보내는 블록 색으로 채우고, 블록과 같은 테두리 · 윗면 빛 · 그림자를 쓴다.
 * 위치·늘어남은 모두 UI 스레드 값이라 손가락을 따라가도 끊기지 않는다.
 */
export function Droplet({ x, y, stretch, angle, opacity, scale, color }: DropletProps) {
    const edgeColor = shade(color, 0.88);

    const containerStyle = useAnimatedStyle(() => ({
        opacity: opacity.get(),
        transform: [
            { translateX: x.get() - CENTER },
            { translateY: y.get() - CENTER },
            { scale: scale.get() },
        ],
    }));

    const bodyStyle = useAnimatedStyle(() => {
        // 멈출 때 0 아래로 튕기면 진행 방향으로는 줄고 옆으로는 퍼진다. (3단계 흔들림)
        const squash = Math.min(0, stretch.get());
        return {
            transform: [
                { rotate: `${angle.get()}rad` },
                { scaleX: 1 + squash * 0.4 },
                { scaleY: 1 - squash * 0.55 },
            ],
        };
    });

    const bodyProps = useAnimatedProps(() => ({
        d: dropletPath(stretch.get(), 0, 0),
    }));

    // 그림자는 화면 기준 아래쪽으로 떨어져야 하므로, 회전한 만큼 반대로 돌려서 옮긴다.
    const shadowProps = useAnimatedProps(() => ({
        d: dropletPath(
            stretch.get(),
            SHADOW_OFFSET * Math.sin(angle.get()),
            SHADOW_OFFSET * Math.cos(angle.get()),
        ),
    }));

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                { position: 'absolute', left: 0, top: 0, width: BOX, height: BOX },
                containerStyle,
            ]}
        >
            <Animated.View style={[{ width: BOX, height: BOX }, bodyStyle]}>
                <Svg width={BOX} height={BOX}>
                    <AnimatedPath animatedProps={shadowProps} fill={withAlpha(edgeColor, 0.28)} />
                    <AnimatedPath
                        animatedProps={bodyProps}
                        fill={color}
                        stroke={shade(color, 0.7)}
                        strokeWidth={1}
                    />
                </Svg>
            </Animated.View>
            {/* 윗면 빛: 방향과 상관없이 늘 위쪽에 둔다. */}
            <Svg width={BOX} height={BOX} style={{ position: 'absolute', left: 0, top: 0 }}>
                <Ellipse
                    cx={CENTER + RADIUS * 0.2}
                    cy={CENTER - RADIUS * 0.45}
                    rx={RADIUS * 0.38}
                    ry={RADIUS * 0.16}
                    fill={withAlpha(colors.white, 0.55)}
                />
            </Svg>
        </Animated.View>
    );
}
