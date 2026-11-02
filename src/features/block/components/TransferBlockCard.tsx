import { Pressable, View } from 'react-native';

import { formatAmount } from '@/lib/format';
import { AppText } from '@/shared/components/ui/AppText';
import { Icon } from '@/shared/components/ui/Icon';
import { colors } from '@/styles/tokens';

import type { HomeBlock } from '@/features/block/types/block';

import { MiniBeaker } from './MiniBeaker';

interface TransferBlockCardProps {
    /** 보내는 블록 · 받는 블록 */
    label: string;
    /** 아직 안 골랐으면 null */
    block: HomeBlock | null;
    /** 옮긴 뒤 잔액 (미리보기가 없으면 null — 지금 잔액만 보여준다) */
    balanceAfter: number | null;
    onPress: () => void;
}

const won = (amount: number) => formatAmount(amount, { showUnit: false });

/**
 * 비커 물 높이 추정: 지금 물 높이 × (옮긴 뒤 잔액 ÷ 지금 잔액)
 * 미리보기 응답에 물 높이가 없어서 그림용으로만 계산한다. (금액·상태는 서버 값을 그대로 쓴다)
 * TODO: simulate 응답 blocks[]에 fillRateAfter가 생기면 그 값으로 바꾼다.
 */
function estimateFillRate(block: HomeBlock, balanceAfter: number) {
    if (block.balance <= 0) {
        return block.fillRate;
    }
    return Math.round(block.fillRate * (balanceAfter / block.balance));
}

/** 03-2 보내는 블록 · 받는 블록 카드 (누르면 다른 블록을 고른다) */
export function TransferBlockCard({ label, block, balanceAfter, onPress }: TransferBlockCardProps) {
    const hasChange = block !== null && balanceAfter !== null && balanceAfter !== block.balance;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={block ? `${label} ${block.name}, 바꾸기` : `${label} 고르기`}
            onPress={onPress}
            className="h-[70px] flex-row items-center gap-3 rounded-12 border border-line bg-white px-3 active:bg-surface-neutral"
        >
            {block ? (
                <MiniBeaker
                    color={block.color}
                    status={block.status}
                    fillRate={hasChange ? estimateFillRate(block, balanceAfter) : block.fillRate}
                    beforeFillRate={hasChange ? block.fillRate : undefined}
                />
            ) : (
                <View className="h-11 w-9 rounded-8 border border-dashed border-line-control" />
            )}
            <View className="flex-1 gap-0.5">
                <AppText className="text-12 text-ink-sub">{label}</AppText>
                <AppText className="font-bold text-15">
                    {block ? block.name : '블록을 골라 주세요'}
                </AppText>
            </View>
            {block && (
                <View className="items-end gap-0.5">
                    {hasChange && (
                        <AppText className="text-12 text-ink-sub line-through">
                            {won(block.balance)}
                        </AppText>
                    )}
                    <AppText className="font-bold text-15">
                        {won(hasChange ? balanceAfter : block.balance)}
                    </AppText>
                </View>
            )}
            <Icon name="chevron-right" size={16} color={colors.ink.sub} />
        </Pressable>
    );
}
