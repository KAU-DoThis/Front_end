import { View } from 'react-native';

import { cn } from '@/lib/cn';
import { AmountInput } from '@/shared/components/ui/AmountInput';
import { AppText } from '@/shared/components/ui/AppText';
import { MiniBeaker } from '@/shared/components/ui/MiniBeaker';

import type { AllocationTarget } from '@/features/block/types/waitingFund';

interface AllocationTargetRowProps {
    target: AllocationTarget;
    /** 원 단위. 비어 있으면 null */
    amount: number | null;
    onChangeAmount: (amount: number | null) => void;
    /** 목록 마지막 줄은 아래 구분선을 그리지 않는다. */
    isLast?: boolean;
}

const STATUS_PREFIX = {
    SAFE: null,
    CAUTION: { label: '주의', className: 'text-caution-text' },
    DANGER: { label: '위험', className: 'text-danger-text' },
} as const;

/** 배분 블록 한 줄: 작은 비커 + 이름·상태 문구 + 금액 입력 (06 · 06-C) */
export function AllocationTargetRow({
    target,
    amount,
    onChangeAmount,
    isLast = false,
}: AllocationTargetRowProps) {
    // 생활비 줄과 더 넣을 필요가 없는 줄은 상태 앞말 없이 회색 문구만 보여준다.
    const prefix = target.canReceive && !target.isDefault ? STATUS_PREFIX[target.status] : null;

    return (
        <View
            className={cn(
                'flex-row items-center gap-3 px-4 py-3',
                !target.canReceive && 'opacity-55',
                !isLast && 'border-b border-line-soft',
            )}
        >
            <MiniBeaker
                size="list"
                color={target.color}
                status={target.status}
                fillRate={target.fillRate}
            />
            <View className="flex-1">
                <AppText className="font-bold text-15" numberOfLines={1}>
                    {target.title}
                </AppText>
                {target.caption && (
                    <AppText
                        className={cn('text-12', prefix ? prefix.className : 'text-ink-sub')}
                        numberOfLines={1}
                    >
                        {prefix ? `${prefix.label}  ${target.caption}` : target.caption}
                    </AppText>
                )}
            </View>
            {target.canReceive ? (
                <AmountInput
                    size="sm"
                    value={amount}
                    onChangeValue={onChangeAmount}
                    accessibilityLabel={`${target.title}에 넣을 금액 (원)`}
                    className="w-32"
                />
            ) : (
                <AppText className="text-12 text-ink-sub">넣을 필요 없어요</AppText>
            )}
        </View>
    );
}
