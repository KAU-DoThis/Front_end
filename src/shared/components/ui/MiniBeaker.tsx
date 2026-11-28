import { View } from 'react-native';

import { cn } from '@/lib/cn';
import { shade, tint, withAlpha } from '@/lib/color';
import type { BlockColor } from '@/shared/components/ui/BlockBeaker';
import type { Status } from '@/shared/components/ui/StatusTag';
import { colors } from '@/styles/tokens';

const STATUS_KEY = { SAFE: 'safe', CAUTION: 'caution', DANGER: 'danger' } as const;

/**
 * lg 56 × 68 (17 목표 달성 시트) / md 36 × 44 (03-2 블록 카드) / list 26 × 32 (06 배분 블록 목록) /
 * sm 20 × 26 (12 절약 목표 설정의 블록 칩)
 */
const SIZE_CLASS = {
    lg: { box: 'h-17 w-14', radius: 'rounded-14' },
    md: { box: 'h-11 w-9', radius: 'rounded-8' },
    list: { box: 'h-8 w-6.5', radius: 'rounded-[7px]' },
    sm: { box: 'h-6.5 w-5', radius: 'rounded-[5px]' },
} as const;

interface MiniBeakerProps {
    color: BlockColor;
    status: Status;
    /** 지금 물 높이 0~100 */
    fillRate: number;
    /** 바뀌기 전 물 높이 — 있으면 점선으로 표시한다. (03-2 이동 전 → 후) */
    beforeFillRate?: number;
    size?: keyof typeof SIZE_CLASS;
}

const clamp = (rate: number) => Math.min(100, Math.max(0, rate));

/**
 * 작은 비커 (36 × 44 · 20 × 26) — 03-2 블록 카드, 초불이의 방 블록 목록, 12 블록 칩
 * 물결 없이 평평한 물 + 이동 전 높이 점선.
 */
export function MiniBeaker({
    color,
    status,
    fillRate,
    beforeFillRate,
    size = 'md',
}: MiniBeakerProps) {
    const waterColor = colors.block[color][STATUS_KEY[status]];
    const edgeColor = shade(waterColor, 0.88);
    const rate = clamp(fillRate);

    return (
        <View
            className={cn('overflow-hidden', SIZE_CLASS[size].box, SIZE_CLASS[size].radius)}
            style={{
                backgroundColor: withAlpha(waterColor, 0.22),
                boxShadow: `0px 2px 6px 0px ${withAlpha(edgeColor, 0.22)}`,
            }}
        >
            <View
                className="absolute bottom-0 left-0 right-0"
                style={{
                    height: `${rate}%`,
                    backgroundColor: waterColor,
                    boxShadow: `inset 0px 1.5px 0px 0px ${withAlpha(colors.white, 0.8)}`,
                }}
            />
            {beforeFillRate !== undefined && (
                <View
                    className="absolute left-0 right-0 border-t border-dashed"
                    style={{
                        bottom: `${clamp(beforeFillRate)}%`,
                        borderColor: shade(waterColor, 0.55),
                    }}
                />
            )}
            {/* 유리 테두리: 위는 밝게, 아래는 어둡게 */}
            <View
                pointerEvents="none"
                className={cn('absolute inset-0 border', SIZE_CLASS[size].radius)}
                style={{
                    borderColor: withAlpha(edgeColor, 0.12),
                    boxShadow: `inset 0px 1px 0px 0px ${withAlpha(tint(waterColor, 0.7), 0.95)}, inset 0px -1px 0px 0px ${withAlpha(edgeColor, 0.45)}`,
                }}
            />
        </View>
    );
}
