import { Pressable, View } from 'react-native';

import type { BlockType } from '@/features/block/types/block';
import type { ProposalReason, SetupBlock } from '@/features/block/types/blockSetup';
import {
    BLOCK_COLOR_BG_CLASS,
    BLOCK_TYPE_LABEL,
    BLOCK_TYPES,
    formatSpendingPeriod,
} from '@/features/block/utils/blockSetupText';
import { cn } from '@/lib/cn';
import { formatAmount } from '@/lib/format';
import { AmountText } from '@/shared/components/ui/AmountText';
import { AppText } from '@/shared/components/ui/AppText';
import { Icon } from '@/shared/components/ui/Icon';
import { Mascot } from '@/shared/components/ui/Mascot';
import { SegmentedControl } from '@/shared/components/ui/SegmentedControl';
import { colors } from '@/styles/tokens';

import { SetupBlockFields, type SetupBlockErrors } from './SetupBlockFields';

/** 근거 문장에서 서버가 정한 부분만 굵게 */
function ReasonText({ reason }: { reason: ProposalReason }) {
    const highlights = reason.highlights.filter((highlight) => highlight !== '');
    if (highlights.length === 0) {
        return <AppText className="flex-1 text-13">{reason.text}</AppText>;
    }

    const escaped = highlights.map((highlight) => highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const parts = reason.text.split(new RegExp(`(${escaped.join('|')})`));

    return (
        <AppText className="flex-1 text-13">
            {parts.map((part, index) =>
                highlights.includes(part) ? (
                    <AppText key={index} className="font-bold text-13">
                        {part}
                    </AppText>
                ) : (
                    part
                ),
            )}
        </AppText>
    );
}

type TagTone = 'neutral' | 'modified';

/** 블록 이름 옆 작은 칩 (22 · 12) */
function Tag({ label, tone }: { label: string; tone: TagTone }) {
    return (
        <View
            className={cn(
                'rounded-8 px-2 py-1',
                tone === 'modified' ? 'bg-surface-neutral' : 'bg-surface-chip',
            )}
        >
            <AppText
                className={cn(
                    'text-12',
                    tone === 'modified'
                        ? 'font-bold text-primary-700'
                        : 'font-semibold text-ink-sub',
                )}
            >
                {label}
            </AppText>
        </View>
    );
}

/** 접힌 카드 둘째 줄 (예: 고정지출형  매월 15일 · 목표형  목표 3,000,000) */
function getCollapsedCaption(block: SetupBlock) {
    const typeLabel = BLOCK_TYPE_LABEL[block.type];
    if (block.type === 'FIXED' && block.payDay !== null) {
        return `${typeLabel}  매월 ${block.payDay}일`;
    }
    if (block.type === 'SPENDING') {
        return `${typeLabel}  ${formatSpendingPeriod(block.periodStartDay ?? 1)}`;
    }
    if (block.type === 'GOAL' && block.targetAmount !== null) {
        return `${typeLabel}  목표 ${formatAmount(block.targetAmount, { showUnit: false })}`;
    }
    return typeLabel;
}

interface SetupBlockCardProps {
    block: SetupBlock;
    isExpanded: boolean;
    /** 마지막으로 펼친 카드. 청록 2px 테두리로 표시한다. */
    isActive: boolean;
    /** AI 제안과 달라졌는지 */
    isModified: boolean;
    errors: SetupBlockErrors;
    isErrorVisible: boolean;
    suggestedAmount: number | null;
    dailyBudget: number | null;
    warning: string | null;
    onToggleExpand: () => void;
    onChange: (patch: Partial<Omit<SetupBlock, 'key'>>) => void;
    onRemove: () => void;
}

/** 온보딩 블록 카드. 누르면 펼쳐서 고치고, 다시 누르면 접는다. (시안 04) */
export function SetupBlockCard({
    block,
    isExpanded,
    isActive,
    isModified,
    errors,
    isErrorVisible,
    suggestedAmount,
    dailyBudget,
    warning,
    onToggleExpand,
    onChange,
    onRemove,
}: SetupBlockCardProps) {
    const hasError = isErrorVisible && Object.keys(errors).length > 0;

    const handleChangeType = (type: BlockType) => {
        if (type === block.type) return;
        // 유형마다 쓰는 값이 달라 새 유형에 필요한 기본값만 채운다. 금액은 그대로 둔다.
        onChange({
            type,
            periodStartDay:
                type === 'SPENDING' ? (block.periodStartDay ?? 1) : block.periodStartDay,
        });
    };

    return (
        <View
            className={cn(
                'rounded-16 bg-white',
                // 고칠 칸이 있으면 마지막으로 펼친 카드여도 오류 테두리를 먼저 보여준다.
                hasError
                    ? 'border-2 border-danger-text'
                    : isExpanded && isActive
                      ? 'border-2 border-primary-600'
                      : 'border border-line',
            )}
        >
            <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: isExpanded }}
                accessibilityLabel={`${block.name} 블록`}
                accessibilityHint={isExpanded ? '눌러서 접기' : '눌러서 고치기'}
                onPress={onToggleExpand}
                className={cn(
                    'flex-row items-center gap-3 rounded-16 px-4 active:bg-surface-neutral',
                    isExpanded ? 'pb-3 pt-5' : 'py-4',
                )}
            >
                <Icon name="grip" size={16} color={colors.ink.disabled} />
                <View className={cn('h-7 w-7 rounded-8', BLOCK_COLOR_BG_CLASS[block.color])} />
                {isExpanded ? (
                    <View className="flex-1 flex-row flex-wrap items-center gap-2">
                        <AppText className="font-bold text-17" numberOfLines={1}>
                            {block.name || '새 블록'}
                        </AppText>
                        {block.createdBy === 'AI' && !block.isDefault && (
                            <Tag label="거래에서 찾음" tone="neutral" />
                        )}
                        {block.isDefault && <Tag label="기본 블록" tone="neutral" />}
                        {isModified && <Tag label="수정됨" tone="modified" />}
                    </View>
                ) : (
                    <>
                        <View className="flex-1 gap-0.5">
                            <AppText className="font-bold text-15" numberOfLines={1}>
                                {block.name || '새 블록'}
                            </AppText>
                            <AppText className="text-12 text-ink-sub" numberOfLines={1}>
                                {getCollapsedCaption(block)}
                            </AppText>
                        </View>
                        {block.amount !== null && (
                            <AmountText amount={block.amount} showUnit={false} />
                        )}
                    </>
                )}
                <Icon
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.ink.sub}
                    strokeWidth={1.5}
                />
            </Pressable>

            {isExpanded && (
                <View className="gap-4 px-4 pb-1">
                    {block.reason && (
                        <View className="flex-row gap-2 rounded-12 bg-surface-app p-3">
                            <Mascot className="h-5.5 w-5.5" />
                            <ReasonText reason={block.reason} />
                        </View>
                    )}
                    <SegmentedControl
                        size="md"
                        options={BLOCK_TYPES.map((type) => ({
                            value: type,
                            label: BLOCK_TYPE_LABEL[type],
                        }))}
                        value={block.type}
                        onChange={handleChangeType}
                        // 기본 블록은 사용형으로 고정이다.
                        disabled={block.isDefault}
                    />
                    <SetupBlockFields
                        block={block}
                        errors={errors}
                        isErrorVisible={isErrorVisible}
                        suggestedAmount={suggestedAmount}
                        dailyBudget={dailyBudget}
                        warning={warning}
                        onChange={onChange}
                    />
                    <View className="flex-row justify-end border-t border-line-soft py-3">
                        {block.isDefault ? (
                            <AppText className="text-12 text-ink-sub">
                                기본 블록이라 뺄 수 없어요
                            </AppText>
                        ) : (
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={`${block.name || '새 블록'} 블록 빼기`}
                                hitSlop={12}
                                onPress={onRemove}
                                className="flex-row items-center gap-1 active:opacity-60"
                            >
                                <Icon name="trash" size={15} color={colors.ink.sub} />
                                <AppText className="text-13 text-ink-sub">이 블록 빼기</AppText>
                            </Pressable>
                        )}
                    </View>
                </View>
            )}
        </View>
    );
}
