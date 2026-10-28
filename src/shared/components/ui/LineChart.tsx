import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { AppText } from '@/shared/components/ui/AppText';
import { colors } from '@/styles/tokens';

export interface ChartPoint {
    x: number;
    y: number;
}

export interface ChartSeries {
    points: ChartPoint[];
    color: string;
    /** 선 두께 (px) */
    width: number;
    /** 점선 [선, 빈칸] (px) */
    dash?: [number, number];
    /** 마지막 점 표시: filled 채운 점 · hollow 흰 속 점 */
    endDot?: 'filled' | 'hollow';
    /** 마지막 점에서 바닥선까지 세로 점선 */
    dropLine?: boolean;
}

interface LineChartProps {
    /** 차트 전체 높이 (아래 축 글자 자리 포함) */
    height: number;
    /** x 범위 (예: 날짜 0~31, 월 0~6) */
    xDomain: [number, number];
    /** y 최댓값 (0부터 시작) */
    yMax: number;
    /** 그림 영역 바깥 여백 (px) */
    padding?: { top: number; bottom: number; left: number; right: number };
    series: ChartSeries[];
    /** 가로 기준선 (y 값 + 색) — 바닥선은 기본으로 그린다. */
    gridLines?: { y: number; color: string }[];
    /** 아래 축 글자 */
    xLabels?: { x: number; label: string }[];
    /** 기준선 위 글자 (예: 목표 800,000) */
    yLabels?: { y: number; label: string }[];
}

const DEFAULT_PADDING = { top: 8, bottom: 8, left: 0, right: 0 };

/**
 * 꺾은선 차트 (라이브러리 없이 react-native-svg로 그린다)
 * 02 소진 속도 · 02-1 목표 도착 예상에서 쓰고, 리포트 차트도 이걸로 늘려간다.
 * 그래프는 청록 계열, 주의 상태 선만 caution 색을 쓴다. (색 규칙)
 */
export function LineChart({
    height,
    xDomain,
    yMax,
    padding = DEFAULT_PADDING,
    series,
    gridLines = [],
    xLabels = [],
    yLabels = [],
}: LineChartProps) {
    const [width, setWidth] = useState(0);

    const handleLayout = (event: LayoutChangeEvent) => {
        setWidth(event.nativeEvent.layout.width);
    };

    const plotWidth = Math.max(0, width - padding.left - padding.right);
    const plotHeight = height - padding.top - padding.bottom;
    const toX = (x: number) =>
        padding.left + ((x - xDomain[0]) / (xDomain[1] - xDomain[0] || 1)) * plotWidth;
    const toY = (y: number) => padding.top + (1 - y / (yMax || 1)) * plotHeight;
    const baseline = toY(0);

    return (
        <View style={{ height }} onLayout={handleLayout}>
            {width > 0 && (
                <Svg width={width} height={height}>
                    <Line
                        x1={0}
                        x2={width}
                        y1={baseline}
                        y2={baseline}
                        stroke={colors.line.DEFAULT}
                        strokeWidth={1}
                    />
                    {gridLines.map((grid) => (
                        <Line
                            key={grid.y}
                            x1={0}
                            x2={width}
                            y1={toY(grid.y)}
                            y2={toY(grid.y)}
                            stroke={grid.color}
                            strokeWidth={1}
                        />
                    ))}
                    {series.map((line, index) => {
                        const last = line.points[line.points.length - 1];
                        return (
                            <SeriesShape
                                key={index}
                                line={line}
                                points={line.points
                                    .map((point) => `${toX(point.x)},${toY(point.y)}`)
                                    .join(' ')}
                                end={last ? { x: toX(last.x), y: toY(last.y) } : undefined}
                                baseline={baseline}
                            />
                        );
                    })}
                </Svg>
            )}
            {width > 0 &&
                yLabels.map((label) => (
                    <AppText
                        key={label.label}
                        className="absolute text-10 text-ink-sub"
                        style={{ left: padding.left + 2, top: toY(label.y) + 2 }}
                    >
                        {label.label}
                    </AppText>
                ))}
            {width > 0 &&
                xLabels.map((label) => (
                    <AppText
                        key={label.label}
                        className="absolute w-10 text-center text-10 text-ink-sub"
                        style={{ left: toX(label.x) - 20, bottom: 0 }}
                    >
                        {label.label}
                    </AppText>
                ))}
        </View>
    );
}

interface SeriesShapeProps {
    line: ChartSeries;
    points: string;
    end?: ChartPoint;
    baseline: number;
}

function SeriesShape({ line, points, end, baseline }: SeriesShapeProps) {
    return (
        <>
            {line.dropLine && end && (
                <Line
                    x1={end.x}
                    x2={end.x}
                    y1={end.y}
                    y2={baseline}
                    stroke={line.color}
                    strokeWidth={1}
                    strokeDasharray={[2, 3]}
                />
            )}
            <Polyline
                points={points}
                fill="none"
                stroke={line.color}
                strokeWidth={line.width}
                strokeDasharray={line.dash}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {end && line.endDot && (
                <Circle
                    cx={end.x}
                    cy={end.y}
                    r={line.endDot === 'filled' ? 4 : 3.5}
                    fill={line.endDot === 'filled' ? line.color : colors.white}
                    stroke={line.endDot === 'hollow' ? line.color : undefined}
                    strokeWidth={line.endDot === 'hollow' ? 1.5 : 0}
                />
            )}
        </>
    );
}
