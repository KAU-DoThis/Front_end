import { useRef } from 'react';
import { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';

import { cn } from '@/lib/cn';
import {
    useBlockDragGesture,
    useDragState,
    useDropTarget,
} from '@/shared/components/motion/DropletLayer';
import { BlockBeaker, getWaterColor, type BeakerSize } from '@/shared/components/ui/BlockBeaker';

import type { HomeBlock } from '@/features/block/types/block';
import { getBlockCaption } from '@/features/block/utils/blockCaption';
import { layoutBlocks, type BlockLayoutItem } from '@/features/block/utils/blockLayout';

/** 드래그를 놓은 직후 들어오는 누르기는 무시한다. (놓자마자 상세로 넘어가지 않게) */
const PRESS_AFTER_DRAG_MS = 300;

interface BlockGridProps {
    blocks: HomeBlock[];
    /** 크기 단계 기준 (총 자산) */
    totalAssets: number;
    onPressBlock: (block: HomeBlock) => void;
    /** 꾹 눌러 끈 물방울을 다른 블록에 놓았을 때 (03-1 → 03-2) */
    onDropBlock: (fromBlockId: number, toBlockId: number) => void;
    /** 드래그 중엔 화면 스크롤을 잠근다. */
    onDraggingChange: (isDragging: boolean) => void;
}

/**
 * 내 블록 2열 배치. 크기는 총 자산 중 비중으로 정하고, 블록이 늘면 아래로 길어진다.
 * 블록을 꾹 누르면 물방울을 뽑아 다른 블록으로 옮길 수 있다. (DropletLayerProvider 안에서 쓴다)
 */
export function BlockGrid({
    blocks,
    totalAssets,
    onPressBlock,
    onDropBlock,
    onDraggingChange,
}: BlockGridProps) {
    const columns = layoutBlocks(blocks, totalAssets);
    const lastDragEndRef = useRef(0);

    const handlers: BlockHandlers = {
        onPress: (block) => {
            if (Date.now() - lastDragEndRef.current < PRESS_AFTER_DRAG_MS) {
                return;
            }
            onPressBlock(block);
        },
        onDrop: onDropBlock,
        onDragStart: () => onDraggingChange(true),
        onDragEnd: () => {
            lastDragEndRef.current = Date.now();
            onDraggingChange(false);
        },
    };

    return (
        <View className="flex-row gap-2">
            {columns.map((items, columnIndex) => (
                <View key={columnIndex} className="flex-1 gap-2">
                    {items.map((item) => (
                        <LayoutItem key={item.key} item={item} handlers={handlers} />
                    ))}
                </View>
            ))}
        </View>
    );
}

interface BlockHandlers {
    onPress: (block: HomeBlock) => void;
    onDrop: (fromBlockId: number, toBlockId: number) => void;
    onDragStart: () => void;
    onDragEnd: () => void;
}

interface LayoutItemProps {
    item: BlockLayoutItem;
    handlers: BlockHandlers;
}

function LayoutItem({ item, handlers }: LayoutItemProps) {
    if (item.kind === 'pair') {
        return (
            <View className="flex-row gap-2">
                {item.blocks.map((block) => (
                    <HomeBlockBeaker
                        key={block.blockId}
                        block={block}
                        size="sm"
                        handlers={handlers}
                        className="flex-1"
                    />
                ))}
            </View>
        );
    }
    return <HomeBlockBeaker block={item.block} size={item.size} handlers={handlers} />;
}

interface HomeBlockBeakerProps {
    block: HomeBlock;
    size: BeakerSize;
    handlers: BlockHandlers;
    className?: string;
}

function HomeBlockBeaker({ block, size, handlers, className }: HomeBlockBeakerProps) {
    const { sourceId, hoverId } = useDragState();
    const targetRef = useDropTarget(block.blockId);
    const gesture = useBlockDragGesture({
        blockId: block.blockId,
        color: getWaterColor(block.color, block.status),
        onStart: handlers.onDragStart,
        onEnd: handlers.onDragEnd,
        onDrop: (toBlockId) => handlers.onDrop(block.blockId, toBlockId),
    });

    const isDragging = sourceId !== null;
    const isSource = sourceId === block.blockId;
    const isTarget = hoverId === block.blockId;

    return (
        <GestureDetector gesture={gesture}>
            <View
                ref={targetRef}
                collapsable={false}
                // 드래그에 상관없는 블록은 흐리게 (03-1)
                className={cn(isDragging && !isSource && !isTarget && 'opacity-40', className)}
            >
                <BlockBeaker
                    name={block.name}
                    amount={block.balance}
                    color={block.color}
                    status={block.status}
                    fillRate={block.fillRate}
                    size={size}
                    caption={getBlockCaption(block)}
                    dragLabel={isSource ? '보내는 중' : isTarget ? '받는 블록' : undefined}
                    onPress={() => handlers.onPress(block)}
                />
                {/* 받는 블록 진한 테두리 — 블록 위에 겹쳐 그려서 배치 크기는 그대로 둔다. */}
                {isTarget && (
                    <View
                        pointerEvents="none"
                        className="absolute inset-0 rounded-16 border-2 border-primary-900"
                    />
                )}
            </View>
        </GestureDetector>
    );
}
