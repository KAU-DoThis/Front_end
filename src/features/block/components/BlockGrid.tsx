import { View } from 'react-native';

import { BlockBeaker, type BeakerSize } from '@/shared/components/ui/BlockBeaker';

import type { HomeBlock } from '@/features/block/types/block';
import { getBlockCaption } from '@/features/block/utils/blockCaption';
import { layoutBlocks, type BlockLayoutItem } from '@/features/block/utils/blockLayout';

interface BlockGridProps {
    blocks: HomeBlock[];
    /** 크기 단계 기준 (총 자산) */
    totalAssets: number;
    onPressBlock: (block: HomeBlock) => void;
}

/** 내 블록 2열 배치. 크기는 총 자산 중 비중으로 정하고, 블록이 늘면 아래로 길어진다. */
export function BlockGrid({ blocks, totalAssets, onPressBlock }: BlockGridProps) {
    const columns = layoutBlocks(blocks, totalAssets);

    return (
        <View className="flex-row gap-2">
            {columns.map((items, columnIndex) => (
                <View key={columnIndex} className="flex-1 gap-2">
                    {items.map((item) => (
                        <LayoutItem key={item.key} item={item} onPressBlock={onPressBlock} />
                    ))}
                </View>
            ))}
        </View>
    );
}

interface LayoutItemProps {
    item: BlockLayoutItem;
    onPressBlock: (block: HomeBlock) => void;
}

function LayoutItem({ item, onPressBlock }: LayoutItemProps) {
    if (item.kind === 'pair') {
        return (
            <View className="flex-row gap-2">
                {item.blocks.map((block) => (
                    <HomeBlockBeaker
                        key={block.blockId}
                        block={block}
                        size="sm"
                        onPressBlock={onPressBlock}
                        className="flex-1"
                    />
                ))}
            </View>
        );
    }
    return <HomeBlockBeaker block={item.block} size={item.size} onPressBlock={onPressBlock} />;
}

interface HomeBlockBeakerProps {
    block: HomeBlock;
    size: BeakerSize;
    onPressBlock: (block: HomeBlock) => void;
    className?: string;
}

function HomeBlockBeaker({ block, size, onPressBlock, className }: HomeBlockBeakerProps) {
    return (
        <BlockBeaker
            name={block.name}
            amount={block.balance}
            color={block.color}
            status={block.status}
            fillRate={block.fillRate}
            size={size}
            caption={getBlockCaption(block)}
            onPress={() => onPressBlock(block)}
            className={className}
        />
    );
}
