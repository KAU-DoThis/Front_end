import { View } from 'react-native';

import { formatAmount } from '@/lib/format';
import { AppText } from '@/shared/components/ui/AppText';
import { Button } from '@/shared/components/ui/Button';
import { Icon } from '@/shared/components/ui/Icon';
import { MiniBeaker } from '@/shared/components/ui/MiniBeaker';
import { StatusTag } from '@/shared/components/ui/StatusTag';
import { colors } from '@/styles/tokens';

import type { ShelfBlock } from '@/features/suggestion/types/agentRoom';

import { PressableScale } from './PressableScale';

interface ShelfPanelProps {
    blocks: ShelfBlock[];
    onPressBlock: (blockId: number) => void;
    onPressBlockTab: () => void;
}

/** 선반을 눌렀을 때 방 아래 패널 (시안 1-1): 블록 요약 목록 */
export function ShelfPanel({ blocks, onPressBlock, onPressBlockTab }: ShelfPanelProps) {
    return (
        <View className="gap-2.5">
            <View className="flex-row items-baseline justify-between">
                <AppText className="font-bold text-17">
                    내 블록 <AppText className="text-17 text-ink-sub">{blocks.length}</AppText>
                </AppText>
                <AppText className="text-12 text-ink-sub">누르면 블록 상세로 가요</AppText>
            </View>

            <View className="overflow-hidden rounded-16 border border-line bg-white">
                {blocks.map((block, index) => (
                    <PressableScale
                        key={block.blockId}
                        accessibilityLabel={`${block.name} ${formatAmount(block.balance)}`}
                        accessibilityHint="블록 상세를 열어요"
                        onPress={() => onPressBlock(block.blockId)}
                    >
                        <View
                            className={
                                index > 0
                                    ? 'flex-row items-center gap-3 border-t border-line-soft px-3.5 py-2'
                                    : 'flex-row items-center gap-3 px-3.5 py-2'
                            }
                        >
                            <MiniBeaker
                                color={block.color}
                                status={block.status}
                                fillRate={block.fillRate}
                            />
                            <AppText className="font-semibold">{block.name}</AppText>
                            {block.badge ? (
                                <View className="rounded-8 bg-primary-50 px-2 py-0.75">
                                    <AppText className="font-bold text-11 text-ink-safe">
                                        {block.badge}
                                    </AppText>
                                </View>
                            ) : (
                                <StatusTag
                                    status={block.status}
                                    className={
                                        block.status === 'SAFE' ? 'bg-primary-50' : undefined
                                    }
                                />
                            )}
                            <AppText className="ml-auto font-bold">
                                {formatAmount(block.balance, { showUnit: false })}
                            </AppText>
                            <Icon name="chevron-right" size={16} color={colors.ink.sub} />
                        </View>
                    </PressableScale>
                ))}
            </View>

            <Button title="블록 탭에서 보기" onPress={onPressBlockTab} />
        </View>
    );
}
