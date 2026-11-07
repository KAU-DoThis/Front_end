import { useState } from 'react';
import { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';

import { cn } from '@/lib/cn';
import {
    DropletLayerProvider,
    useBlockDragGesture,
    useDragState,
    useDropTarget,
    useDropletFlyTo,
} from '@/shared/components/motion/DropletLayer';
import { AppText } from '@/shared/components/ui/AppText';
import { BlockBeaker, type BlockColor } from '@/shared/components/ui/BlockBeaker';
import { Button } from '@/shared/components/ui/Button';
import type { Status } from '@/shared/components/ui/StatusTag';
import { colors } from '@/styles/tokens';

interface DemoBlock {
    id: number;
    name: string;
    amount: number;
    color: BlockColor;
    status: Status;
    fillRate: number;
}

const DEMO_BLOCKS: DemoBlock[] = [
    { id: 1, name: '여행', amount: 320_000, color: 'o', status: 'CAUTION', fillRate: 40 },
    { id: 2, name: '생활비', amount: 950_000, color: 'i', status: 'CAUTION', fillRate: 63 },
    { id: 3, name: '월세', amount: 600_000, color: 'l', status: 'SAFE', fillRate: 100 },
];

const STATUS_KEY = { SAFE: 'safe', CAUTION: 'caution', DANGER: 'danger' } as const;

interface DropletDemoProps {
    /** 드래그 중엔 화면 스크롤을 잠근다. */
    onDraggingChange: (isDragging: boolean) => void;
}

/** 개발용: 물방울 드래그(03-1 1~3단계)와 초불이 연출(flyTo) 확인 */
export function DropletDemo({ onDraggingChange }: DropletDemoProps) {
    return (
        <DropletLayerProvider>
            <DemoContent onDraggingChange={onDraggingChange} />
        </DropletLayerProvider>
    );
}

function DemoContent({ onDraggingChange }: DropletDemoProps) {
    const [lastDrop, setLastDrop] = useState<string | null>(null);
    const { sourceId, hoverId } = useDragState();
    const flyTo = useDropletFlyTo();

    const nameOf = (id: number | null) => DEMO_BLOCKS.find((block) => block.id === id)?.name;

    return (
        <View className="gap-3">
            <AppText className="text-13 text-ink-sub">
                {sourceId !== null
                    ? hoverId !== null
                        ? `${nameOf(hoverId)} 위에서 손을 떼세요`
                        : '다른 블록 위로 끌어 주세요'
                    : (lastDrop ?? '블록을 꾹 눌러 물방울을 끌어 보세요')}
            </AppText>
            <View className="flex-row gap-2">
                {DEMO_BLOCKS.map((block) => (
                    <DemoBeaker
                        key={block.id}
                        block={block}
                        isSource={sourceId === block.id}
                        isHover={hoverId === block.id}
                        isDimmed={
                            sourceId !== null && sourceId !== block.id && hoverId !== block.id
                        }
                        onDraggingChange={onDraggingChange}
                        onDrop={(toId) => setLastDrop(`${block.name} → ${nameOf(toId)}에 놓았어요`)}
                    />
                ))}
            </View>
            <Button
                title="여행 → 생활비 자동으로 보내기 (초불이)"
                variant="secondary"
                size="sm"
                onPress={() => flyTo(1, 2, colors.block.o.caution)}
            />
        </View>
    );
}

interface DemoBeakerProps {
    block: DemoBlock;
    isSource: boolean;
    isHover: boolean;
    isDimmed: boolean;
    onDraggingChange: (isDragging: boolean) => void;
    onDrop: (toId: number) => void;
}

function DemoBeaker({
    block,
    isSource,
    isHover,
    isDimmed,
    onDraggingChange,
    onDrop,
}: DemoBeakerProps) {
    const targetRef = useDropTarget(block.id);
    const gesture = useBlockDragGesture({
        blockId: block.id,
        color: colors.block[block.color][STATUS_KEY[block.status]],
        onStart: () => onDraggingChange(true),
        onEnd: () => onDraggingChange(false),
        onDrop,
    });

    return (
        <GestureDetector gesture={gesture}>
            <View
                ref={targetRef}
                collapsable={false}
                className={cn(
                    'flex-1 rounded-16 border-2 border-transparent',
                    isHover && 'border-primary-700',
                    isDimmed && 'opacity-50',
                )}
            >
                <BlockBeaker
                    name={block.name}
                    amount={block.amount}
                    color={block.color}
                    status={block.status}
                    fillRate={block.fillRate}
                    size="sm"
                    caption={isSource ? '보내는 중' : isHover ? '받는 블록' : undefined}
                />
            </View>
        </GestureDetector>
    );
}
