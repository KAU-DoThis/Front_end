import { View } from 'react-native';

import { formatWon } from '@/lib/format';
import { AmountText } from '@/shared/components/ui/AmountText';
import { AppText } from '@/shared/components/ui/AppText';

import type { AllocationDraft } from '@/features/block/types/waitingFund';

interface AllocationSummaryCardProps {
    draft: AllocationDraft;
}

/** 배분하기 상단: 어떤 돈을 얼마 나누는지 (06 절약분 · 06-C 추가 입금) */
export function AllocationSummaryCard({ draft }: AllocationSummaryCardProps) {
    const { waitingFund, breakdown, note } = draft;

    return (
        <View className="rounded-16 border border-line p-4">
            <View className="flex-row items-center gap-2">
                <View className="rounded-8 bg-surface-neutral px-2 py-0.5">
                    <AppText className="font-semibold text-12 text-ink-safe">
                        {waitingFund.label}
                    </AppText>
                </View>
                {waitingFund.description && (
                    <AppText className="flex-1 text-13 text-ink-sub" numberOfLines={1}>
                        {waitingFund.description}
                    </AppText>
                )}
            </View>
            <View className="mt-2 flex-row items-baseline gap-3">
                <AmountText amount={waitingFund.amount} className="text-30 tracking-[-0.5px]" />
                <AppText className="text-15 text-ink-sub">을 나눠 넣어요</AppText>
            </View>
            {breakdown.length > 0 && (
                <View className="mt-1.5 flex-row flex-wrap gap-x-4">
                    {breakdown.map((item) => (
                        <AppText key={item.label} className="text-13 text-ink-sub">
                            {item.label}{' '}
                            <AppText className="font-bold text-13">
                                {formatWon(item.amount, { showUnit: false })}
                            </AppText>
                        </AppText>
                    ))}
                </View>
            )}
            {note && <AppText className="mt-1 text-12 text-ink-sub">{note}</AppText>}
        </View>
    );
}
