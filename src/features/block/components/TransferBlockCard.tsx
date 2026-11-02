import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
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
    /** 바꿀 수 없는 블록 (블록 상세에서 열었을 때 그 블록) — 누를 수 없고 > 표시가 없다. */
    isLocked?: boolean;
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

/**
 * 03-2 보내는 블록 · 받는 블록 카드 (누르면 다른 블록을 고른다)
 * 왼쪽은 [라벨 / 블록 이름], 오른쪽은 [이동 전 금액(취소선) 또는 '잔액' / 지금 금액] 두 줄로 맞춘다.
 */
export function TransferBlockCard({
    label,
    block,
    balanceAfter,
    isLocked = false,
    onPress,
}: TransferBlockCardProps) {
    if (!block) {
        return <EmptyBlockCard label={label} onPress={onPress} />;
    }

    const hasChange = balanceAfter !== null && balanceAfter !== block.balance;

    return (
        <Pressable
            accessibilityRole={isLocked ? undefined : 'button'}
            accessibilityLabel={
                isLocked ? `${label} ${block.name}` : `${label} ${block.name}, 바꾸기`
            }
            disabled={isLocked}
            onPress={onPress}
            className={cn(
                'h-[70px] flex-row items-center gap-3 rounded-12 border border-line bg-white px-3',
                !isLocked && 'active:bg-surface-neutral',
            )}
        >
            <MiniBeaker
                color={block.color}
                status={block.status}
                fillRate={hasChange ? estimateFillRate(block, balanceAfter) : block.fillRate}
                beforeFillRate={hasChange ? block.fillRate : undefined}
            />
            <View className="flex-1 gap-0.5">
                <AppText className="text-12 text-ink-sub">{label}</AppText>
                <AppText className="font-bold text-15" numberOfLines={1}>
                    {block.name}
                </AppText>
            </View>
            <View className="items-end gap-0.5">
                {hasChange ? (
                    <AppText className="text-12 text-ink-sub line-through">
                        {won(block.balance)}
                    </AppText>
                ) : (
                    <AppText className="text-12 text-ink-sub">잔액</AppText>
                )}
                <AppText className="font-bold text-15">
                    {won(hasChange ? balanceAfter : block.balance)}
                </AppText>
            </View>
            {!isLocked && <Icon name="chevron-right" size={16} color={colors.ink.sub} />}
        </Pressable>
    );
}

/** 아직 블록을 안 골랐을 때 — 누르면 고르는 화면이 열린다는 걸 바로 알 수 있게 + 버튼 모양으로 둔다. */
function EmptyBlockCard({ label, onPress }: { label: string; onPress: () => void }) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${label} 고르기`}
            onPress={onPress}
            className="h-[70px] flex-row items-center gap-3 rounded-12 border border-primary-100 bg-primary-50 px-3 active:bg-surface-chip"
        >
            <View className="h-11 w-9 items-center justify-center rounded-8 bg-white">
                <Icon name="plus" size={18} color={colors.primary[700]} />
            </View>
            <View className="flex-1 gap-0.5">
                <AppText className="text-12 text-ink-sub">{label}</AppText>
                <AppText className="font-bold text-15 text-primary-700">블록 고르기</AppText>
            </View>
            <Icon name="chevron-right" size={16} color={colors.primary[700]} />
        </Pressable>
    );
}
