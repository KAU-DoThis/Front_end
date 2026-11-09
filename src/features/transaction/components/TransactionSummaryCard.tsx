import { View } from 'react-native';

import { cn } from '@/lib/cn';
import { AmountText } from '@/shared/components/ui/AmountText';
import { AppText } from '@/shared/components/ui/AppText';

interface SummaryHalfProps {
    label: string;
    amount: number;
    caption: string | null;
    className?: string;
}

function SummaryHalf({ label, amount, caption, className }: SummaryHalfProps) {
    return (
        <View className={cn('flex-1 gap-0.5 p-4', className)}>
            <AppText className="text-12 text-ink-sub">{label}</AppText>
            <AmountText amount={amount} showUnit={false} className="text-20" />
            {caption && (
                <AppText numberOfLines={1} className="text-12 text-ink-sub">
                    {caption}
                </AppText>
            )}
        </View>
    );
}

interface TransactionSummaryCardProps {
    spentAmount: number;
    /** 쓴 돈 아래 문구 (예: 임시 1건 포함 · KB국민 ••1234) */
    spentCaption: string | null;
    incomeAmount: number;
    /** 들어온 돈 아래 문구 (예: 월급 25일 예정) */
    incomeCaption: string | null;
}

/** 쓴 돈 / 들어온 돈 (시안 09 위쪽 카드) */
export function TransactionSummaryCard({
    spentAmount,
    spentCaption,
    incomeAmount,
    incomeCaption,
}: TransactionSummaryCardProps) {
    return (
        <View className="flex-row overflow-hidden rounded-16 border border-line">
            <SummaryHalf
                label="쓴 돈"
                amount={spentAmount}
                caption={spentCaption}
                className="border-r border-line-soft"
            />
            <SummaryHalf label="들어온 돈" amount={incomeAmount} caption={incomeCaption} />
        </View>
    );
}
