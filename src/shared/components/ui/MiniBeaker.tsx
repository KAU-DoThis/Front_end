import { View } from 'react-native';

import { shade, tint, withAlpha } from '@/lib/color';
import type { BlockColor } from '@/shared/components/ui/BlockBeaker';
import type { Status } from '@/shared/components/ui/StatusTag';
import { colors } from '@/styles/tokens';

const STATUS_KEY = { SAFE: 'safe', CAUTION: 'caution', DANGER: 'danger' } as const;

interface MiniBeakerProps {
    color: BlockColor;
    status: Status;
    /** 지금 물 높이 0~100 */
    fillRate: number;
    /** 바뀌기 전 물 높이 — 있으면 점선으로 표시한다. (03-2 이동 전 → 후) */
    beforeFillRate?: number;
}

const clamp = (rate: number) => Math.min(100, Math.max(0, rate));

/**
 * 작은 비커 (36 × 44) — 03-2 블록 카드, 초불이의 방 블록 목록
 * 물결 없이 평평한 물 + 이동 전 높이 점선.
 */
export function MiniBeaker({ color, status, fillRate, beforeFillRate }: MiniBeakerProps) {
    const waterColor = colors.block[color][STATUS_KEY[status]];
    const edgeColor = shade(waterColor, 0.88);
    const rate = clamp(fillRate);

    return (
        <View
            className="h-11 w-9 overflow-hidden rounded-8"
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
                className="absolute inset-0 rounded-8 border"
                style={{
                    borderColor: withAlpha(edgeColor, 0.12),
                    boxShadow: `inset 0px 1px 0px 0px ${withAlpha(tint(waterColor, 0.7), 0.95)}, inset 0px -1px 0px 0px ${withAlpha(edgeColor, 0.45)}`,
                }}
            />
        </View>
    );
}
