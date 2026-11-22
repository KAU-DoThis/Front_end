import { View } from 'react-native';

import { AmountText } from '@/shared/components/ui/AmountText';
import { AppText } from '@/shared/components/ui/AppText';
import { Button } from '@/shared/components/ui/Button';

import type { ConfirmedSaving } from '@/features/goal/types/saving';

interface ConfirmedSavingBannerProps {
    confirmed: ConfirmedSaving;
    /** 나누기 → 배분하기(06 절약분) 화면 */
    onSplit?: (waitingFundId: number) => void;
}

/** "2026-09" → 9 */
const toMonth = (yearMonth: string) => Number(yearMonth.slice(5, 7));

/** 확정 절약분 배너 (점선 · 대기 블록과 같은 모양) */
export function ConfirmedSavingBanner({ confirmed, onSplit }: ConfirmedSavingBannerProps) {
    return (
        <View className="flex-row items-center rounded-16 border-1.5 border-dashed border-line-control p-3.5">
            <View className="flex-1">
                <View className="flex-row items-center gap-2">
                    <View className="rounded-8 bg-surface-neutral px-2 py-0.5">
                        <AppText className="font-semibold text-12 text-ink-sub">절약분</AppText>
                    </View>
                    <AppText className="text-13 text-ink-sub">
                        {toMonth(confirmed.month)}월 절약이 확정됐어요
                    </AppText>
                </View>
                <AmountText amount={confirmed.amount} className="mt-1 text-20" />
                <AppText className="mt-0.5 text-12 text-ink-sub">{confirmed.text}</AppText>
            </View>
            <Button
                title="나누기"
                size="md"
                accessibilityLabel="절약분 나누기"
                onPress={onSplit ? () => onSplit(confirmed.waitingFundId) : undefined}
                className="ml-3"
            />
        </View>
    );
}
