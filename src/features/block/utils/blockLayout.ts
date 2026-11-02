import { BEAKER_HEIGHT, type BeakerSize } from '@/shared/components/ui/BlockBeaker';

import type { HomeBlock } from '@/features/block/types/block';

/**
 * 블록 크기 단계 기준: 총 자산 중 블록 잔액 비중
 * 사람마다 자산 규모가 달라 금액이 아니라 비중으로 나눈다.
 * (시안 01 홈: 저축 44% 대 · 생활비 21% 중 · 월세 13%·저금통 11% 소 · 여행 7% 띠)
 */
const SIZE_THRESHOLDS: { size: BeakerSize; minShare: number }[] = [
    { size: 'lg', minShare: 0.3 },
    { size: 'md', minShare: 0.15 },
    { size: 'sm', minShare: 0.08 },
];

/** 블록 사이 간격 (gap-2) */
export const BLOCK_GAP = 8;

export function getBeakerSize(balance: number, totalAssets: number): BeakerSize {
    if (totalAssets <= 0) {
        return 'xs';
    }
    const share = balance / totalAssets;
    return SIZE_THRESHOLDS.find(({ minShare }) => share >= minShare)?.size ?? 'xs';
}

/** 열 하나에 들어가는 한 칸: 블록 하나(열 전체 폭) 또는 소 블록 둘(반 폭씩) */
export type BlockLayoutItem =
    | { kind: 'single'; key: string; block: HomeBlock; size: BeakerSize }
    | { kind: 'pair'; key: string; blocks: [HomeBlock, HomeBlock] };

/**
 * 2열 배치
 * 1. 잔액이 큰 순서로 정렬하고 비중으로 크기 단계를 정한다.
 * 2. 소(sm) 블록은 두 개씩 묶어 한 칸에 나란히 둔다. 짝이 없으면 중(md) 크기로 둔다.
 * 3. 칸을 하나씩 더 짧은 열에 넣는다. (같으면 왼쪽) → 블록이 늘어나면 아래로 길어진다.
 */
export function layoutBlocks(blocks: HomeBlock[], totalAssets: number) {
    const sorted = [...blocks].sort(
        (a, b) => b.balance - a.balance || a.displayOrder - b.displayOrder,
    );

    const items: BlockLayoutItem[] = [];
    let waitingSmall: HomeBlock | null = null;

    for (const block of sorted) {
        const size = getBeakerSize(block.balance, totalAssets);
        if (size !== 'sm') {
            items.push({ kind: 'single', key: String(block.blockId), block, size });
            continue;
        }
        if (waitingSmall) {
            items.push({
                kind: 'pair',
                key: `${waitingSmall.blockId}-${block.blockId}`,
                blocks: [waitingSmall, block],
            });
            waitingSmall = null;
        } else {
            waitingSmall = block;
        }
    }

    if (waitingSmall) {
        // 짝 없는 소 블록: 순서를 지키기 위해 띠(xs) 블록들 앞에 둔다.
        const firstStripIndex = items.findIndex(
            (item) => item.kind === 'single' && item.size === 'xs',
        );
        const lonely: BlockLayoutItem = {
            kind: 'single',
            key: String(waitingSmall.blockId),
            block: waitingSmall,
            size: 'md',
        };
        items.splice(firstStripIndex === -1 ? items.length : firstStripIndex, 0, lonely);
    }

    const columns: [BlockLayoutItem[], BlockLayoutItem[]] = [[], []];
    const heights = [0, 0];

    for (const item of items) {
        const column = heights[0] <= heights[1] ? 0 : 1;
        columns[column].push(item);
        heights[column] += getItemHeight(item) + BLOCK_GAP;
    }

    return columns;
}

function getItemHeight(item: BlockLayoutItem) {
    return item.kind === 'pair' ? BEAKER_HEIGHT.sm : BEAKER_HEIGHT[item.size];
}
