import { View } from 'react-native';

import { cn } from '@/lib/cn';
import { formatWon } from '@/lib/format';
import { AppText } from '@/shared/components/ui/AppText';

interface DeltaBadgeProps {
    /** 지출 증감 (원). 늘면 빨강 ▲, 줄면 파랑 ▼ */
    diffAmount: number;
    /** 있으면 금액 뒤에 붙인다. (예: 12%) */
    diffPercent?: number;
    /** 맨 뒤에 붙는 문구 (예: 줄었어요 — 월간 리포트) */
    label?: string;
}

/** 지출 증감 칩 (모서리 8 · 12 SemiBold). 지출이 늘어나는 건 내 돈이 줄어드는 쪽이라 빨강이다. */
export function DeltaBadge({ diffAmount, diffPercent, label }: DeltaBadgeProps) {
    const isIncrease = diffAmount > 0;
    const amountText = `${isIncrease ? '▲' : '▼'} ${formatWon(Math.abs(diffAmount), { showUnit: false })}`;
    const percentText =
        diffPercent === undefined ? amountText : `${amountText}  ${Math.abs(diffPercent)}%`;
    const text = label ? `${percentText} ${label}` : percentText;

    return (
        <View
            className={cn(
                'self-center rounded-8 px-2 py-0.5',
                isIncrease ? 'bg-delta-down-bg' : 'bg-delta-up-bg',
            )}
        >
            <AppText
                className={cn(
                    'font-semibold text-12',
                    isIncrease ? 'text-delta-down' : 'text-delta-up',
                )}
            >
                {text}
            </AppText>
        </View>
    );
}
