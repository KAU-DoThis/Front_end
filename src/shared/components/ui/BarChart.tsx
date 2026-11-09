import { useState, type ReactNode } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { cn } from '@/lib/cn';
import { AppText } from '@/shared/components/ui/AppText';

export interface BarChartBar {
    key: string;
    value: number;
    color: string;
    /** 막대 바로 위 숫자 (예: 9번) */
    valueLabel?: string;
    /** 막대 위 숫자를 진한 글씨로 (가장 많은 막대 등) */
    isEmphasized?: boolean;
    /** 막대 아래 이름 (예: 밤 · 22시~) */
    footer?: ReactNode;
}

interface BarChartProps {
    bars: BarChartBar[];
    /** 가장 큰 값의 막대 높이 (px) */
    maxBarHeight: number;
    /** 0이거나 아주 작은 값도 보이게 하는 바닥 막대 높이 (px) */
    minBarHeight?: number;
    /** 막대 위·아래 모서리 반지름 (막대가 낮으면 높이에 맞춰 줄인다) */
    radius?: { top: number; bottom: number };
    accessibilityLabel?: string;
}

/** 막대 사이 틈 — 아래 이름 줄의 gap-3과 같아야 칸이 맞는다. */
const BAR_GAP = 12;
/** 막대 위 숫자(12 · 행간 18) + 띄움 4 */
const VALUE_LABEL_SPACE = 22;

/** 위·아래 모서리 반지름이 다른 막대 경로 */
function roundedBarPath(
    x: number,
    y: number,
    width: number,
    height: number,
    top: number,
    bottom: number,
) {
    const rt = Math.min(top, width / 2, height / 2);
    const rb = Math.min(bottom, width / 2, height / 2);
    return [
        `M${x},${y + rt}`,
        `A${rt},${rt} 0 0 1 ${x + rt},${y}`,
        `H${x + width - rt}`,
        `A${rt},${rt} 0 0 1 ${x + width},${y + rt}`,
        `V${y + height - rb}`,
        `A${rb},${rb} 0 0 1 ${x + width - rb},${y + height}`,
        `H${x + rb}`,
        `A${rb},${rb} 0 0 1 ${x},${y + height - rb}`,
        'Z',
    ].join(' ');
}

/**
 * 세로 막대 차트 (라이브러리 없이 react-native-svg로 그린다)
 * 막대 높이는 값에 비례한다. 11 소비 분석 '언제 많이 쓰나요?'에서 쓴다.
 */
export function BarChart({
    bars,
    maxBarHeight,
    minBarHeight = 0,
    radius = { top: 0, bottom: 0 },
    accessibilityLabel,
}: BarChartProps) {
    const [width, setWidth] = useState(0);

    const handleLayout = (event: LayoutChangeEvent) => {
        setWidth(event.nativeEvent.layout.width);
    };

    const maxValue = Math.max(1, ...bars.map(({ value }) => value));
    const columnWidth = bars.length > 0 ? (width - BAR_GAP * (bars.length - 1)) / bars.length : 0;
    const toHeight = (value: number) => Math.max(minBarHeight, (value / maxValue) * maxBarHeight);
    const hasFooter = bars.some(({ footer }) => footer !== undefined);

    return (
        <View accessible={!!accessibilityLabel} accessibilityLabel={accessibilityLabel}>
            <View style={{ height: maxBarHeight + VALUE_LABEL_SPACE }} onLayout={handleLayout}>
                {width > 0 && (
                    <Svg
                        width={width}
                        height={maxBarHeight}
                        style={{ position: 'absolute', bottom: 0 }}
                    >
                        {bars.map((bar, index) => {
                            const height = toHeight(bar.value);
                            return (
                                <Path
                                    key={bar.key}
                                    d={roundedBarPath(
                                        index * (columnWidth + BAR_GAP),
                                        maxBarHeight - height,
                                        columnWidth,
                                        height,
                                        radius.top,
                                        radius.bottom,
                                    )}
                                    fill={bar.color}
                                />
                            );
                        })}
                    </Svg>
                )}
                {width > 0 &&
                    bars.map((bar, index) =>
                        // 빈 문자열이 View 안에 그려지면 RN이 오류를 내므로 삼항으로 거른다.
                        bar.valueLabel ? (
                            <AppText
                                key={bar.key}
                                className={cn(
                                    'absolute text-center font-bold text-12',
                                    bar.isEmphasized ? 'text-ink' : 'text-ink-sub',
                                )}
                                style={{
                                    left: index * (columnWidth + BAR_GAP),
                                    width: columnWidth,
                                    bottom: toHeight(bar.value) + 4,
                                }}
                            >
                                {bar.valueLabel}
                            </AppText>
                        ) : null,
                    )}
            </View>
            {hasFooter && (
                <View className="mt-2 flex-row gap-3">
                    {bars.map((bar) => (
                        <View key={bar.key} className="flex-1 items-center">
                            {bar.footer}
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}
