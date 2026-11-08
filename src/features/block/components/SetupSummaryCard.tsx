import { ActivityIndicator, Pressable, View } from 'react-native';

import type {
    BlockSetupPreview,
    BlockSetupRequest,
    SetupBlock,
} from '@/features/block/types/blockSetup';
import { BLOCK_COLOR_BG_CLASS } from '@/features/block/utils/blockSetupText';
import { getSetupBlockInputAmount } from '@/features/block/utils/setupBlockInput';
import { cn } from '@/lib/cn';
import { formatAmount } from '@/lib/format';
import { AmountText } from '@/shared/components/ui/AmountText';
import { AppText } from '@/shared/components/ui/AppText';
import { Card } from '@/shared/components/ui/Card';
import { colors } from '@/styles/tokens';

interface SummaryItemProps {
    label: string;
    amount: number;
    tone?: 'default' | 'primary' | 'danger';
}

const TONE_CLASS = {
    default: 'text-ink',
    primary: 'text-primary-700',
    danger: 'text-danger-text',
} as const;

function SummaryItem({ label, amount, tone = 'default' }: SummaryItemProps) {
    return (
        <View className="flex-1 gap-0.5">
            <AppText className="text-12 text-ink-sub">{label}</AppText>
            <AmountText amount={amount} showUnit={false} className={TONE_CLASS[tone]} />
        </View>
    );
}

interface SetupSummaryCardProps {
    /** 서버가 계산한 결과와 그 결과를 계산한 요청. 처음 받기 전에는 undefined */
    result: { preview: BlockSetupPreview; request: BlockSetupRequest } | undefined;
    /** 막대 색·순서를 정하는 블록 (화면 순서) */
    blocks: SetupBlock[];
    /** 계산 요청이 실패했는지. 이전 결과가 있으면 그걸 보여주면서 오류도 같이 알린다. */
    isError: boolean;
    onRetry: () => void;
}

function RetryButton({ onRetry }: { onRetry: () => void }) {
    return (
        <Pressable
            accessibilityRole="button"
            hitSlop={12}
            onPress={onRetry}
            className="active:opacity-60"
        >
            <AppText className="font-semibold text-13 text-primary-700">다시 시도</AppText>
        </Pressable>
    );
}

/** 연동 계좌 잔액 · 블록에 나눈 돈 · 나눌 돈 + 블록별 비율 막대 (시안 04 위쪽 카드) */
export function SetupSummaryCard({ result, blocks, isError, onRetry }: SetupSummaryCardProps) {
    if (!result && isError) {
        return (
            <Card className="h-28 items-center justify-center gap-2">
                <AppText className="text-13 text-ink-sub" accessibilityLiveRegion="polite">
                    합계를 계산하지 못했어요
                </AppText>
                <RetryButton onRetry={onRetry} />
            </Card>
        );
    }

    if (!result) {
        return (
            <Card className="h-28 items-center justify-center">
                <ActivityIndicator color={colors.primary[700]} />
            </Card>
        );
    }

    const { preview, request } = result;
    const isOverAllocated = preview.remainingAmount < 0;
    // 막대는 합계와 같은 기준(이 결과를 계산한 요청의 금액)으로 그린다.
    // 고친 금액을 바로 쓰면 새 결과를 기다리는 동안 막대 비율이 보이는 합계와 달라진다.
    const amountByKey = new Map(
        request.blocks.map((input) => [input.key, getSetupBlockInputAmount(input) ?? 0]),
    );
    const barBlocks = blocks
        .map((block) => ({ ...block, barAmount: amountByKey.get(block.key) ?? 0 }))
        .filter(({ barAmount }) => barAmount > 0);

    return (
        <Card className="gap-3">
            <View className="flex-row">
                <SummaryItem label="연동 계좌 잔액" amount={preview.linkedBalance} />
                <SummaryItem label="블록에 나눈 돈" amount={preview.allocatedAmount} />
                <SummaryItem
                    label="나눌 돈"
                    amount={preview.remainingAmount}
                    tone={isOverAllocated ? 'danger' : 'primary'}
                />
            </View>
            {/* 칸 너비는 금액에 비례한다. 남은 돈(나눌 돈)은 테두리만 있는 빈칸이다. */}
            <View
                className="h-2.5 flex-row gap-0.5 overflow-hidden rounded-full"
                importantForAccessibility="no-hide-descendants"
            >
                {barBlocks.map((block) => (
                    <View
                        key={block.key}
                        className={cn('h-full', BLOCK_COLOR_BG_CLASS[block.color])}
                        style={{ flex: block.barAmount }}
                    />
                ))}
                {!isOverAllocated && preview.remainingAmount > 0 && (
                    <View
                        className="h-full border border-line"
                        style={{ flex: preview.remainingAmount }}
                    />
                )}
            </View>
            <AppText
                className={cn('text-12', isOverAllocated ? 'text-danger-text' : 'text-ink-sub')}
            >
                {isOverAllocated
                    ? `잔액보다 ${formatAmount(-preview.remainingAmount)} 더 나눴어요`
                    : '나눌 돈은 홈에 두고, 저축·여행 같은 블록을 만들 때 나눠요'}
            </AppText>
            {/* 다시 계산하다 실패하면 이전 값은 두고, 지금 내용이 반영되지 않았다고 알린다. */}
            {isError && (
                <View
                    className="flex-row items-center justify-between border-t border-line pt-3"
                    accessibilityLiveRegion="polite"
                >
                    <AppText className="text-12 text-danger-text">
                        고친 내용으로 다시 계산하지 못했어요
                    </AppText>
                    <RetryButton onRetry={onRetry} />
                </View>
            )}
        </Card>
    );
}
