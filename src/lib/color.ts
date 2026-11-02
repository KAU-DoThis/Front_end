/**
 * 토큰 색(#RRGGBB)에서 파생 색을 만든다.
 * 새 색을 하드코딩하지 않고, 블록 색처럼 토큰 하나에서 그림자·테두리 색을 뽑을 때 쓴다.
 */

function toRgb(hex: string) {
    const value = parseInt(hex.replace('#', ''), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255] as const;
}

function toHex(channels: readonly number[]) {
    return `#${channels
        .map((channel) =>
            Math.round(Math.min(255, Math.max(0, channel)))
                .toString(16)
                .padStart(2, '0'),
        )
        .join('')}`;
}

/** 투명도를 붙인다. (#8FB3E8, 0.22 → #8FB3E838) */
export function withAlpha(hex: string, alpha: number) {
    return `${toHex(toRgb(hex))}${toHex([alpha * 255]).slice(1)}`;
}

/** 어둡게 한다. factor 0.88 → 각 채널 × 0.88 */
export function shade(hex: string, factor: number) {
    return toHex(toRgb(hex).map((channel) => channel * factor));
}

/** 흰색을 섞어 밝게 한다. amount 0.7 → 흰색 70% */
export function tint(hex: string, amount: number) {
    return toHex(toRgb(hex).map((channel) => channel + (255 - channel) * amount));
}
