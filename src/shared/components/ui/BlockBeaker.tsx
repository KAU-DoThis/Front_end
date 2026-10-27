import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { cn } from '@/lib/cn';
import { shade, tint, withAlpha } from '@/lib/color';
import { AmountText } from '@/shared/components/ui/AmountText';
import { AppText } from '@/shared/components/ui/AppText';
import { StatusTag, type Status } from '@/shared/components/ui/StatusTag';
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
 * 물결은 정적이다. (움직임은 나중에 Reanimated로 붙인다)
 */
export function BlockBeaker({
    name,
    amount,
    color,
    status,
    fillRate,
    size,
    caption,
    onPress,
    className,
    style,
}: BlockBeakerProps) {
    const waterColor = colors.block[color][STATUS_KEY[status]];
    // 테두리·그림자는 시안처럼 블록 색을 조금 어둡게 쓴다.
    const edgeColor = shade(waterColor, 0.88);
    const rate = Math.min(100, Math.max(0, fillRate));
    const sizeStyle = SIZE_STYLE[size];

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${name} 블록, ${amount.toLocaleString('ko-KR')}원`}
            disabled={!onPress}
            onPress={onPress}
            className={cn('rounded-16 active:opacity-80', className)}
            style={[
                {
                    height: BEAKER_HEIGHT[size],
                    boxShadow: `0px 6px 14px 0px ${withAlpha(edgeColor, 0.22)}`,
                },
                style,
            ]}
        >
            <View
                className="flex-1 overflow-hidden rounded-16"
                style={{ backgroundColor: withAlpha(waterColor, 0.22) }}
            >
                <Water color={waterColor} rate={rate} isStrip={size === 'xs'} />
                {/* 유리 테두리: 위는 밝게, 아래는 어둡게 1px */}
                <View
                    pointerEvents="none"
                    className="absolute inset-0 rounded-16 border"
                    style={{
                        borderColor: withAlpha(edgeColor, 0.12),
                        boxShadow: `inset 0px 1px 0px 0px ${withAlpha(tint(waterColor, 0.7), 0.95)}, inset 0px -1px 0px 0px ${withAlpha(edgeColor, 0.45)}`,
                    }}
                />
                <View className={cn('flex-1 justify-between', sizeStyle.container)}>
                    {size === 'sm' ? (
                        <View className="items-start">
                            <AppText numberOfLines={1} className="font-bold text-13">
                                {name}
                            </AppText>
                            <StatusTag status={status} />
                        </View>
                    ) : (
                        <View className="flex-row items-center justify-between gap-1">
                            <AppText
                                numberOfLines={1}
                                className={cn('shrink font-bold', sizeStyle.name)}
                            >
                                {name}
                            </AppText>
                            <StatusTag status={status} />
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
                </View>
            </View>
        </Pressable>
    );
}

const STATUS_KEY = { SAFE: 'safe', CAUTION: 'caution', DANGER: 'danger' } as const;

// 물결 경로 (시안 wave/back · wave, 너비 171 기준 — 블록 너비에 맞춰 가로로 늘인다)
const WAVE_BACK =
    'M0 5.83331C28.5 12.8333 57 12.8333 85.5 5.83331C114 -1.16669 142.5 -1.16669 171 5.83331V14H0V5.83331Z';
const WAVE_FRONT_FILL =
    'M0 5.5C21.375 0 42.75 0 64.125 5.5C85.5 11 106.875 11 128.25 5.5C149.625 0 159.6 0.916667 171 3.66667V11H0V5.5Z';
const WAVE_FRONT_LINE =
    'M0 5.5C21.375 -2.98023e-08 42.75 -2.98023e-08 64.125 5.5C85.5 11 106.875 11 128.25 5.5C149.625 -2.98023e-08 159.6 0.916667 171 3.66667';
// 띠(xs) 블록은 낮아서 물결이 한 겹이고 더 납작하다.
const WAVE_STRIP_FILL =
    'M0 4C21.375 0 42.75 0 64.125 4C85.5 8 106.875 8 128.25 4C149.625 0 159.6 0.666667 171 2.66667V8H0V4Z';
const WAVE_STRIP_LINE =
    'M0 4C21.375 -2.98023e-08 42.75 -2.98023e-08 64.125 4C85.5 8 106.875 8 128.25 4C149.625 -2.98023e-08 159.6 0.666667 171 2.66667';

interface WaterProps {
    color: string;
    /** 0~100 */
    rate: number;
    isStrip: boolean;
}

function Water({ color, rate, isStrip }: WaterProps) {
    const isFull = rate >= 100;
    const lineColor = withAlpha(colors.white, 0.8);

    return (
        <View
            pointerEvents="none"
            className="absolute bottom-0 left-0 right-0"
            style={{ height: `${rate}%`, backgroundColor: color }}
        >
            {/* 가득 찬 블록은 물결 없이 색으로만 채운다. (시안 월세 · 저금통) */}
            {!isFull &&
                (isStrip ? (
                    <Svg
                        width="100%"
                        height={8}
                        viewBox="0 0 171 8"
                        preserveAspectRatio="none"
                        style={{ position: 'absolute', top: -7 }}
                    >
                        <Path d={WAVE_STRIP_FILL} fill={color} />
                        <Path
                            d={WAVE_STRIP_LINE}
                            fill="none"
                            stroke={lineColor}
                            strokeWidth={1.46}
                            vectorEffect="non-scaling-stroke"
                        />
                    </Svg>
                ) : (
                    <>
                        <Svg
                            width="100%"
                            height={14}
                            viewBox="0 0 171 14"
                            preserveAspectRatio="none"
                            style={{ position: 'absolute', top: -13 }}
                        >
                            <Path d={WAVE_BACK} fill={color} opacity={0.45} />
                        </Svg>
                        <Svg
                            width="100%"
                            height={11}
                            viewBox="0 0 171 11"
                            preserveAspectRatio="none"
                            style={{ position: 'absolute', top: -10 }}
                        >
                            <Path d={WAVE_FRONT_FILL} fill={color} />
                            <Path
                                d={WAVE_FRONT_LINE}
                                fill="none"
                                stroke={lineColor}
                                strokeWidth={1.71}
                                vectorEffect="non-scaling-stroke"
                            />
                        </Svg>
                    </>
                ))}
        </View>
    );
}
