import { View } from 'react-native';

import { formatAmount } from '@/lib/format';
import { AmountText } from '@/shared/components/ui/AmountText';
import { AppText } from '@/shared/components/ui/AppText';
import { BeakerSurface } from '@/shared/components/ui/BlockBeaker';
import { StatusTag } from '@/shared/components/ui/StatusTag';

import type { HomeBlock } from '@/features/block/types/block';

const TYPE_LABEL = { SPENDING: '사용형', GOAL: '목표형', FIXED: '고정지출형' } as const;

interface BlockHeroCardProps {
    block: HomeBlock;
    /** 상태 칩 옆 이유 (예: 소진 빠름) */
    statusReason: string | null;
    /** 큰 금액 위 문구 (남은 금액 · 모은 돈 · 확보한 돈) */
    amountLabel: string;
    /** 큰 금액 옆 "/ 1,500,000" (배분 · 목표 · 납부 금액) */
    total: number;
    /** 아래 왼쪽 (예: 10월 1일 ~ 31일  63% 남음) */
    footerLeft: string;
    /** 아래 오른쪽 (예: 18일 남음, D-78) */
    footerRight: string;
}

/** 블록 상세 맨 위 큰 비커 카드 (350×200, 시안 02 · 02-1 · 02-2) */
export function BlockHeroCard({
    block,
    statusReason,
    amountLabel,
    total,
    footerLeft,
    footerRight,
}: BlockHeroCardProps) {
    return (
        <BeakerSurface
            color={block.color}
            status={block.status}
            fillRate={block.fillRate}
            wave="card"
            radius={24}
            className="h-[200px]"
            contentClassName="justify-between px-5 py-4"
        >
            <View>
                <View className="flex-row gap-2">
                    <View className="rounded-8 bg-white/65 px-3 py-1">
                        <AppText className="font-semibold text-12">
                            {TYPE_LABEL[block.type]}
                        </AppText>
                    </View>
                    <StatusTag status={block.status} size="md" reason={statusReason ?? undefined} />
                </View>
                <AppText className="mt-[15px] text-13">{amountLabel}</AppText>
                <View className="flex-row items-end gap-2">
                    <AmountText amount={block.balance} className="text-30 tracking-[-0.5px]" />
                    <AppText className="pb-[3px]">
                        / {formatAmount(total, { showUnit: false })}
                    </AppText>
                </View>
            </View>
            <View className="flex-row justify-between">
                <AppText className="font-semibold text-12">{footerLeft}</AppText>
                <AppText className="font-semibold text-12">{footerRight}</AppText>
            </View>
        </BeakerSurface>
    );
}
