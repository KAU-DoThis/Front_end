import { useId, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { ClipPath, Defs, G, Rect } from 'react-native-svg';

export interface BarSegment {
    key: string;
    value: number;
    color: string;
}

interface HorizontalBarProps {
    /** 왼쪽부터 순서대로 그린다. */
    segments: BarSegment[];
    height: number;
    /** 모서리 반지름 */
    radius: number;
    /**
     * 바탕 막대 색. 주면 진행 막대처럼 total 대비 길이만큼만 채우고, 채운 칸 끝도 둥글게 한다.
     * 없으면 칸들이 막대 전체를 나눠 채운다. (비율 막대)
     */
    trackColor?: string;
    /** 막대 끝까지가 나타내는 값 (기본: segments 합 — 가득 채운다) */
    total?: number;
    /** 칸 사이 틈 (px) */
    gap?: number;
}

/**
 * 가로 막대 (라이브러리 없이 react-native-svg로 그린다)
 * 칸 너비는 값에 비례한다. 11 소비 분석 분류별 비율 막대 · 지난달 비교 막대에서 쓴다.
 */
export function HorizontalBar({
    segments,
    height,
    radius,
    trackColor,
    total,
    gap = 0,
}: HorizontalBarProps) {
    const [width, setWidth] = useState(0);
    // url(#id)에 쓸 수 있도록 영문·숫자만 남긴다.
    const clipId = `bar-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

    const handleLayout = (event: LayoutChangeEvent) => {
        setWidth(event.nativeEvent.layout.width);
    };

    const sum = segments.reduce((acc, { value }) => acc + value, 0);
    const fullValue = total ?? sum;
    const available = Math.max(0, width - gap * Math.max(0, segments.length - 1));
    const toWidth = (value: number) => (fullValue > 0 ? (value / fullValue) * available : 0);
    // 앞 칸들의 너비 + 틈만큼 오른쪽에서 시작한다.
    const rects = segments.map((segment, index) => ({
        ...segment,
        x: segments
            .slice(0, index)
            .reduce((acc, previous) => acc + toWidth(previous.value) + gap, 0),
        width: toWidth(segment.value),
    }));

    return (
        <View style={{ height }} onLayout={handleLayout}>
            {width > 0 && (
                <Svg width={width} height={height}>
                    <Defs>
                        <ClipPath id={clipId}>
                            <Rect width={width} height={height} rx={radius} ry={radius} />
                        </ClipPath>
                    </Defs>
                    <G clipPath={`url(#${clipId})`}>
                        {trackColor && <Rect width={width} height={height} fill={trackColor} />}
                        {rects.map((rect) => (
                            <Rect
                                key={rect.key}
                                x={rect.x}
                                width={rect.width}
                                height={height}
                                rx={trackColor ? radius : 0}
                                ry={trackColor ? radius : 0}
                                fill={rect.color}
                            />
                        ))}
                    </G>
                </Svg>
            )}
        </View>
    );
}
