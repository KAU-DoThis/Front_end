import { Pressable, View } from 'react-native';

import { formatMonth, formatMonthDay } from '@/lib/format';
import { AmountText } from '@/shared/components/ui/AmountText';
import { AppText } from '@/shared/components/ui/AppText';
import { Icon } from '@/shared/components/ui/Icon';

import type { PendingMoney } from '@/features/block/types/blockHome';

interface PendingMoneySectionProps {
    items: PendingMoney[];
    /** 나누기 (⑤ 대기 블록 배분 화면에서 연결) */
    onSplit?: (item: PendingMoney) => void;
}

const SOURCE_LABEL = { SAVING: '절약분', DEPOSIT: '추가 입금' } as const;

function getDetail(item: PendingMoney) {
    if (item.source === 'SAVING') {
        return `${formatMonth(item.periodEndDate)} 절약 확정`;
    }
    return item.lastDepositAt ? `${formatMonthDay(item.lastDepositAt)} 입금` : '블록에 안 넣은 돈';
}

/** 절약분은 절약 목표마다 따로, 추가 입금(미배분 잔액)은 하나만 온다. */
function getKey(item: PendingMoney) {
    return item.source === 'SAVING' ? `saving-${item.savingGoalId}` : 'deposit';
}

/** 나눌 돈 (대기 블록). 다 나누면 섹션이 사라진다. */
export function PendingMoneySection({ items, onSplit }: PendingMoneySectionProps) {
    if (items.length === 0) {
        return null;
    }

    // 2개씩 한 줄. 홀수면 마지막 줄 오른쪽은 비워 둔다.
    const rows: PendingMoney[][] = [];
    for (let index = 0; index < items.length; index += 2) {
        rows.push(items.slice(index, index + 2));
    }

    return (
        <View className="gap-2">
            <View className="flex-row items-center justify-between">
                <AppText className="font-semibold text-13 text-ink-sub">
                    나눌 돈 {items.length}
                </AppText>
                <AppText className="text-12 text-ink-sub">다 나누면 사라져요</AppText>
            </View>
            {rows.map((row) => (
                <View key={getKey(row[0])} className="flex-row gap-2">
                    {row.map((item) => (
                        <PendingMoneyCard
                            key={getKey(item)}
                            item={item}
                            onPress={onSplit ? () => onSplit(item) : undefined}
                        />
                    ))}
                    {row.length === 1 && <View className="flex-1" />}
                </View>
            ))}
        </View>
    );
}

interface PendingMoneyCardProps {
    item: PendingMoney;
    onPress?: () => void;
}

function PendingMoneyCard({ item, onPress }: PendingMoneyCardProps) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${SOURCE_LABEL[item.source]} ${item.amount.toLocaleString('ko-KR')}원 나누기`}
            onPress={onPress}
            className="flex-1 rounded-16 border-1.5 border-dashed border-line-control bg-white p-[11.5px] active:bg-surface-neutral"
        >
            <View className="flex-row items-center justify-between">
                <View className="rounded-8 bg-surface-neutral px-2 py-0.5">
                    <AppText className="font-semibold text-12 text-ink-sub">
                        {SOURCE_LABEL[item.source]}
                    </AppText>
                </View>
                <View className="flex-row items-center">
                    <AppText className="font-bold text-13">나누기</AppText>
                    <Icon name="chevron-right" size={14} strokeWidth={1.4} />
                </View>
            </View>
            <AmountText amount={item.amount} showUnit={false} className="mt-1.5 text-17" />
            <AppText className="text-12 text-ink-sub">{getDetail(item)}</AppText>
        </Pressable>
    );
}
