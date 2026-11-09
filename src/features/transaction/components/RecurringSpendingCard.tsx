import { View } from 'react-native';

import { AmountText } from '@/shared/components/ui/AmountText';
import { AppText } from '@/shared/components/ui/AppText';
import { Card } from '@/shared/components/ui/Card';

import type { SpendingAnalysis } from '@/features/transaction/types/spendingAnalysis';

interface RecurringSpendingCardProps {
    items: SpendingAnalysis['recurring'];
}

/** 반복해서 나가는 돈 (반복 소비 · 중복 구독 · 고정지출) */
export function RecurringSpendingCard({ items }: RecurringSpendingCardProps) {
    return (
        <Card>
            <AppText className="font-bold text-15">반복해서 나가는 돈</AppText>
            <View className="mt-2">
                {items.map((item) => (
                    <View
                        key={item.name}
                        className="h-[59px] flex-row items-center gap-3 border-t border-line-soft"
                    >
                        <View className="flex-1 gap-0.5">
                            <View className="flex-row items-center gap-2">
                                <AppText numberOfLines={1} className="shrink font-semibold text-15">
                                    {item.name}
                                </AppText>
                                <View className="rounded-8 bg-surface-neutral px-2 py-0.5">
                                    <AppText className="font-semibold text-12">{item.tag}</AppText>
                                </View>
                            </View>
                            <AppText numberOfLines={1} className="text-12 text-ink-sub">
                                {item.description}
                            </AppText>
                        </View>
                        <AmountText amount={item.amount} showUnit={false} className="text-15" />
                    </View>
                ))}
            </View>
        </Card>
    );
}
