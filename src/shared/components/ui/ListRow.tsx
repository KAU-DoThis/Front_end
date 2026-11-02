import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import { AmountText } from '@/shared/components/ui/AmountText';
import { AppText } from '@/shared/components/ui/AppText';

interface ListRowProps {
    title: string;
    /** 둘째 줄 (예: "식비  어제 23:04") */
    subtitle?: string;
    /** 둘째 줄 끝에 청록으로 붙는 맥락 태그 (예: 야근) */
    tag?: string;
    /** 오른쪽 금액 (원 단위, 부호 포함) */
    amount?: number;
    /** up: 들어온 돈(파랑, + 붙임) / default: 평범한 지출(검정) */
    amountTone?: 'default' | 'up';
    /** 왼쪽 아이콘 자리 (28px) */
    leading?: ReactNode;
    /** 마지막 줄은 아래 구분선을 뺀다. */
    isLast?: boolean;
    onPress?: () => void;
}

/** 거래·기록 목록 한 줄 (높이 57, 구분선 line/soft) — 블록 상세 · 내역에서 같이 쓴다. */
export function ListRow({
    title,
    subtitle,
    tag,
    amount,
    amountTone = 'default',
    leading,
    isLast = false,
    onPress,
}: ListRowProps) {
    return (
        <Pressable
            disabled={!onPress}
            onPress={onPress}
            className={cn(
                'min-h-[57px] flex-row items-center gap-3 px-4 py-3 active:bg-surface-neutral',
                !isLast && 'border-b border-line-soft',
            )}
        >
            {leading}
            <View className="flex-1 gap-0.5">
                <AppText numberOfLines={1} className="font-semibold text-15">
                    {title}
                </AppText>
                {(subtitle || tag) && (
                    <AppText numberOfLines={1} className="text-12 text-ink-sub">
                        {subtitle}
                        {tag && (
                            <AppText className="text-12 text-primary-700">{`  ${tag}`}</AppText>
                        )}
                    </AppText>
                )}
            </View>
            {amount !== undefined && (
                <AmountText
                    amount={amount}
                    tone={amountTone}
                    showSign={amountTone === 'up'}
                    showUnit={false}
                    className="font-semibold text-15"
                />
            )}
        </Pressable>
    );
}
