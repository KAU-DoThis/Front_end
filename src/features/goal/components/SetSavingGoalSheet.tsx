import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import { formatAmount, formatMonthDay, formatWon } from '@/lib/format';
import { AppText } from '@/shared/components/ui/AppText';
import { BottomSheet, BottomSheetTextInput } from '@/shared/components/ui/BottomSheet';
import { Button } from '@/shared/components/ui/Button';
import { MiniBeaker } from '@/shared/components/ui/MiniBeaker';
import { ScreenState } from '@/shared/components/ui/ScreenState';
import { ApiError } from '@/shared/types/api';
import { colors, fontFamily } from '@/styles/tokens';

import {
    useCreateSavingGoalMutation,
    useIsCreatingSavingGoal,
} from '@/features/goal/api/useCreateSavingGoalMutation';
import { useSavingGoalDraftQuery } from '@/features/goal/api/useSavingGoalDraftQuery';
import type { SavingGoalDraft, SavingGoalTargetBlock } from '@/features/goal/types/saving';

/** −1만 · +1만 버튼 한 번에 바뀌는 금액 */
const STEP = 10_000;

/** 1조 원 아래까지만 받는다. (공통 금액 입력칸과 같음) */
const MAX_DIGITS = 13;

interface SetSavingGoalSheetProps {
    isOpen: boolean;
    onClose: () => void;
    /** 목표로 세울 절약 후보. 열기 전에는 null */
    suggestionId: number | null;
    /** 열 때마다 바꿔 주면 입력값이 제안값에서 새로 시작한다. */
    formKey: number;
}

/** 12 절약 목표 설정 시트 (F-03) — 절약 후보 카드의 '목표로 설정' */
export function SetSavingGoalSheet({
    isOpen,
    onClose,
    suggestionId,
    formKey,
}: SetSavingGoalSheetProps) {
    const draft = useSavingGoalDraftQuery(suggestionId);
    // 보내는 중에 닫히면 실패 안내를 못 보고, 다른 후보를 열어 또 보낼 수 있어서 막아 둔다.
    const isCreating = useIsCreatingSavingGoal();

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            isDismissible={!isCreating}
            title={draft.data ? `${draft.data.category} 절약 목표` : '절약 목표'}
            description={draft.data?.action}
            hasCloseButton
            scrollable
        >
            {draft.data ? (
                <SavingGoalForm key={formKey} draft={draft.data} onDone={onClose} />
            ) : draft.isError ? (
                <ScreenState
                    className="h-80"
                    variant="error"
                    title="목표 정보를 불러오지 못했어요"
                    description="잠시 후 다시 시도해 주세요"
                    actionTitle="다시 시도"
                    onPressAction={() => draft.refetch()}
                />
            ) : (
                <ScreenState
                    className="h-80"
                    variant="loading"
                    title="목표 정보를 불러오는 중이에요"
                />
            )}
        </BottomSheet>
    );
}

interface SavingGoalFormProps {
    draft: SavingGoalDraft;
    onDone: () => void;
}

function SavingGoalForm({ draft, onDone }: SavingGoalFormProps) {
    const [limit, setLimit] = useState<number | null>(draft.recommendedLimit);
    const [targetBlockId, setTargetBlockId] = useState(draft.recommendedBlockId);
    const { mutate: create, isPending } = useCreateSavingGoalMutation();

    const { baseAmount } = draft;
    // 기준 지출액만큼 쓰면 아끼는 게 없으므로 기준보다 적어야 한다.
    const isOverBase = limit !== null && limit >= baseAmount;
    // 입력하는 동안 바로 바뀌는 미리보기라 화면에서 뺀다. 실제 절약액은 기간이 끝나고 서버가 확정한다.
    const expectedSaving = limit !== null && !isOverBase ? baseAmount - limit : 0;
    const canSubmit = limit !== null && !isOverBase && !isPending;

    const handleChangeText = (text: string) => {
        const digits = text.replace(/\D/g, '').slice(0, MAX_DIGITS);
        setLimit(digits === '' ? null : Number(digits));
    };

    const handleSubmit = () => {
        if (!canSubmit) return;
        create(
            {
                suggestionId: draft.suggestionId,
                limit,
                startDate: draft.startDate,
                endDate: draft.endDate,
                targetBlockId,
            },
            {
                onSuccess: onDone,
                onError: (error) => {
                    Alert.alert(
                        '목표를 시작하지 못했어요',
                        error instanceof ApiError ? error.message : '잠시 후 다시 시도해 주세요',
                    );
                },
            },
        );
    };

    return (
        <View>
            <View className="h-[42px] flex-row items-center justify-between rounded-12 bg-surface-app px-4">
                <AppText className="text-13 text-ink-sub">
                    기준 지출액 <AppText className="text-12 text-ink-sub">(최근 3달 평균)</AppText>
                </AppText>
                <AppText className="font-bold text-15">{formatWon(baseAmount)}</AppText>
            </View>

            <AppText className="mt-4 text-13 text-ink-sub">한 달 목표 지출액</AppText>
            <View
                className={cn(
                    'h-12 flex-row items-center border-b-2',
                    isOverBase ? 'border-danger-text' : 'border-primary-600',
                )}
            >
                <BottomSheetTextInput
                    accessibilityLabel="한 달 목표 지출액 (원)"
                    value={limit === null ? '' : formatAmount(limit, { showUnit: false })}
                    onChangeText={handleChangeText}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={colors.ink.disabled}
                    editable={!isPending}
                    style={{
                        flex: 1,
                        padding: 0,
                        fontFamily: fontFamily.bold,
                        fontSize: 30,
                        lineHeight: 42,
                        color: colors.ink.DEFAULT,
                        includeFontPadding: false,
                        textAlignVertical: 'center',
                    }}
                />
                <AppText className="ml-1 font-semibold text-20">원</AppText>
            </View>
            {isOverBase && (
                <AppText className="mt-2 text-12 text-danger-text" accessibilityLiveRegion="polite">
                    기준 지출액({formatWon(baseAmount)})보다 적게 정해 주세요
                </AppText>
            )}

            <View className="mt-3 flex-row gap-2">
                <QuickButton
                    label={
                        draft.recommendedLabel ? `제안대로  ${draft.recommendedLabel}` : '제안대로'
                    }
                    accessibilityLabel={`제안대로 ${formatWon(draft.recommendedLimit)}`}
                    isSelected={limit === draft.recommendedLimit}
                    disabled={isPending}
                    onPress={() => setLimit(draft.recommendedLimit)}
                />
                <QuickButton
                    label="−1만"
                    accessibilityLabel="만 원 줄이기"
                    disabled={isPending || limit === null || limit === 0}
                    onPress={() => setLimit(Math.max(0, (limit ?? 0) - STEP))}
                />
                <QuickButton
                    label="+1만"
                    accessibilityLabel="만 원 늘리기"
                    // 더하면 기준 지출액에 닿으면 막는다.
                    disabled={isPending || (limit ?? 0) + STEP >= baseAmount}
                    onPress={() => setLimit((limit ?? 0) + STEP)}
                />
            </View>

            <View className="mt-4 h-[58px] flex-row items-center justify-between rounded-12 border border-primary-100 bg-surface-neutral px-4">
                <AppText className="font-semibold text-15 text-primary-700">예상 절약액</AppText>
                <AppText className="font-bold text-20 text-primary-700">
                    월 {formatWon(expectedSaving)}
                </AppText>
            </View>

            <View className="mt-7 flex-row items-center">
                <AppText className="w-[72px] text-13 text-ink-sub">기간</AppText>
                <AppText className="font-semibold text-15">
                    {formatMonthDay(draft.startDate)} ~ {formatMonthDay(draft.endDate)}
                    {'  '}
                    {draft.periodMonths}개월
                </AppText>
            </View>

            <AppText className="mt-6 text-13 text-ink-sub">확정되면 넣을 블록 · 선택</AppText>
            <View className="mt-2 flex-row flex-wrap gap-2">
                {draft.targetBlocks.map((block) => (
                    <TargetBlockChip
                        key={block.blockId}
                        block={block}
                        isSelected={targetBlockId === block.blockId}
                        disabled={isPending}
                        onPress={() => setTargetBlockId(block.blockId)}
                    />
                ))}
                <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: targetBlockId === null, disabled: isPending }}
                    disabled={isPending}
                    onPress={() => setTargetBlockId(null)}
                    className={cn(
                        'h-12 items-center justify-center rounded-12 bg-white px-1.5',
                        targetBlockId === null
                            ? 'border-2 border-primary-700'
                            : 'border border-dashed border-ink-disabled',
                    )}
                >
                    <AppText className="px-1.5 text-13 text-ink-sub">나중에</AppText>
                </Pressable>
            </View>

            <AppText className="mt-4 text-12 leading-[18px] text-ink-sub">
                목표를 넘겨도 기준({formatWon(baseAmount)})보다 적게 쓰면 그만큼 절약으로 인정해요.
                기간이 끝난 다음 날 실제 쓴 돈으로 확정하고, 그때 홈의 절약분 블록에 모아둬요.
            </AppText>

            <Button
                className="mt-10"
                title="목표 시작하기"
                loadingTitle="목표 시작하는 중"
                isLoading={isPending}
                disabled={!canSubmit}
                onPress={handleSubmit}
            />
        </View>
    );
}

interface QuickButtonProps {
    label: string;
    accessibilityLabel: string;
    isSelected?: boolean;
    disabled?: boolean;
    onPress: () => void;
}

/** 목표 지출액 빠른 버튼 (32 · 8). 지금 값이 제안값이면 '제안대로'를 진하게 보여준다. */
function QuickButton({
    label,
    accessibilityLabel,
    isSelected = false,
    disabled = false,
    onPress,
}: QuickButtonProps) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={{ selected: isSelected, disabled }}
            disabled={disabled}
            hitSlop={6}
            onPress={onPress}
            className={cn(
                'h-8 items-center justify-center rounded-8 border bg-white px-3 active:bg-surface-chip',
                disabled
                    ? 'border-dashed border-line-disabled'
                    : isSelected
                      ? 'border-line-control'
                      : 'border-primary-100',
            )}
        >
            <AppText
                className={cn(
                    'text-13',
                    disabled
                        ? 'text-ink-disabled'
                        : isSelected
                          ? 'font-semibold text-primary-700'
                          : 'text-ink',
                )}
            >
                {label}
            </AppText>
        </Pressable>
    );
}

interface TargetBlockChipProps {
    block: SavingGoalTargetBlock;
    isSelected: boolean;
    disabled: boolean;
    onPress: () => void;
}

const STATUS_LABEL_CLASS = {
    SAFE: 'text-ink-sub',
    CAUTION: 'text-caution-soft-text',
    DANGER: 'text-danger-text',
} as const;

/** 확정되면 절약분을 넣을 블록 칩 (48 · 12). 고르면 진한 2px 테두리 */
function TargetBlockChip({ block, isSelected, disabled, onPress }: TargetBlockChipProps) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={
                block.statusLabel ? `${block.name}, ${block.statusLabel}` : block.name
            }
            accessibilityState={{ selected: isSelected, disabled }}
            disabled={disabled}
            onPress={onPress}
            className={cn(
                'h-12 flex-row items-center gap-2 rounded-12 bg-white pl-3 pr-3.5',
                isSelected ? 'border-2 border-primary-700' : 'border border-line',
            )}
        >
            <MiniBeaker
                size="sm"
                color={block.color}
                status={block.status}
                fillRate={block.fillRate}
            />
            <View>
                <AppText className={cn('text-15', isSelected ? 'font-bold' : 'font-semibold')}>
                    {block.name}
                </AppText>
                {block.statusLabel && (
                    <AppText
                        className={cn('font-semibold text-12', STATUS_LABEL_CLASS[block.status])}
                    >
                        {block.statusLabel}
                    </AppText>
                )}
            </View>
        </Pressable>
    );
}
