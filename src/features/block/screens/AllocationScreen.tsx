import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { cn } from '@/lib/cn';
import { formatWon } from '@/lib/format';
import { Screen } from '@/shared/components/layout/Screen';
import { ScreenHeader } from '@/shared/components/layout/ScreenHeader';
import { AmountText } from '@/shared/components/ui/AmountText';
import { AppText } from '@/shared/components/ui/AppText';
import { Button } from '@/shared/components/ui/Button';
import { Icon } from '@/shared/components/ui/Icon';
import { ImpactList } from '@/shared/components/ui/ImpactList';
import { ScreenState } from '@/shared/components/ui/ScreenState';
import { SegmentedControl, type SegmentedOption } from '@/shared/components/ui/SegmentedControl';
import { ApiError } from '@/shared/types/api';
import { colors } from '@/styles/tokens';

import { useAllocateWaitingFundMutation } from '@/features/block/api/useAllocateWaitingFundMutation';
import { useAllocationDraftQuery } from '@/features/block/api/useAllocationDraftQuery';
import { useSimulateAllocationQuery } from '@/features/block/api/useSimulateAllocationQuery';
import { AllocationSummaryCard } from '@/features/block/components/AllocationSummaryCard';
import { AllocationTargetRow } from '@/features/block/components/AllocationTargetRow';
import type { AllocationDraft, AllocationTarget } from '@/features/block/types/waitingFund';
import { WAITING_FUND_ERROR_CODE } from '@/features/block/types/waitingFund';

type AllocationMode = 'MANUAL' | 'AI';

const MODE_OPTIONS: SegmentedOption<AllocationMode>[] = [
    { value: 'MANUAL', label: '직접 고르기' },
    { value: 'AI', label: 'AI 제안' },
];

type Amounts = Record<number, number | null>;

/** 서버가 정해 준 금액으로 채운다. 0원은 빈칸(회색 0)으로 둔다. */
const toSuggestedAmounts = (targets: AllocationTarget[]): Amounts =>
    Object.fromEntries(
        targets
            .filter((target) => target.canReceive)
            .map((target) => [target.blockId, target.suggestedAmount || null]),
    );

/** 06 배분하기 · 절약분 / 06-C 배분하기 · 추가 입금 (나눌 돈 → 블록) */
export function AllocationScreen() {
    const params = useLocalSearchParams<{ waitingFundId: string }>();
    const waitingFundId = Number(params.waitingFundId);
    const isValidId = Number.isInteger(waitingFundId) && waitingFundId > 0;
    const draft = useAllocationDraftQuery(waitingFundId);
    const isNotFound =
        !isValidId ||
        (draft.error instanceof ApiError && draft.error.code === WAITING_FUND_ERROR_CODE.NOT_FOUND);

    return (
        <Screen>
            <ScreenHeader title="배분하기" />
            {/* 다시 받는 중 실패해도 받아 둔 값이 있으면 그대로 보여준다. */}
            {draft.data ? (
                <AllocationContent draft={draft.data} />
            ) : isNotFound ? (
                <ScreenState
                    variant="empty"
                    title="나눌 돈이 없어요"
                    description="이미 다 나눴을 수 있어요"
                    actionTitle="돌아가기"
                    onPressAction={router.back}
                />
            ) : draft.isError ? (
                <ScreenState
                    variant="error"
                    title="나눌 돈을 불러오지 못했어요"
                    description="잠시 후 다시 시도해 주세요"
                    actionTitle="다시 시도"
                    onPressAction={() => draft.refetch()}
                />
            ) : (
                <ScreenState variant="loading" title="나눌 돈을 불러오는 중이에요" />
            )}
        </Screen>
    );
}

interface AllocationContentProps {
    draft: AllocationDraft;
}

function AllocationContent({ draft }: AllocationContentProps) {
    const { waitingFund, targets } = draft;
    const [mode, setMode] = useState<AllocationMode>('MANUAL');
    const [amounts, setAmounts] = useState<Amounts>(() => toSuggestedAmounts(targets));
    const allocate = useAllocateWaitingFundMutation();

    // [blockId, 금액] — 0원보다 큰 것만 미리보기·확정에 보낸다.
    const entries: [number, number][] = targets
        .filter((target) => target.canReceive)
        .map((target): [number, number] => [target.blockId, amounts[target.blockId] ?? 0])
        .filter(([, amount]) => amount > 0);
    const allocatedTotal = entries.reduce((sum, [, amount]) => sum + amount, 0);
    const remaining = waitingFund.amount - allocatedTotal;
    const isOver = remaining < 0;

    const simulation = useSimulateAllocationQuery({
        waitingFundId: waitingFund.waitingFundId,
        amounts: entries,
    });
    const result = entries.length > 0 ? simulation.data : undefined;
    const blockedReason = result?.blocked ? result.blockedReason : null;

    const canSubmit =
        allocatedTotal > 0 &&
        !isOver &&
        !simulation.isStale &&
        result !== undefined &&
        !result.blocked;

    const handleChangeMode = (next: AllocationMode) => {
        setMode(next);
        // AI 제안: 서버가 정해 준 금액으로 다시 채운다. 직접 고르기로 돌아가도 고친 값은 그대로 둔다.
        if (next === 'AI') {
            setAmounts(toSuggestedAmounts(targets));
        }
    };

    const handleChangeAmount = (blockId: number, amount: number | null) => {
        setAmounts((previous) => ({ ...previous, [blockId]: amount }));
        // 금액을 직접 고치면 더는 AI 제안이 아니다.
        setMode('MANUAL');
    };

    const handleSubmit = () => {
        if (!canSubmit || !result || allocate.isPending) return;
        const versionOf = (blockId: number) =>
            result.blocks.find((block) => block.blockId === blockId)?.version ??
            targets.find((target) => target.blockId === blockId)?.version ??
            0;

        allocate.mutate(
            {
                waitingFundId: waitingFund.waitingFundId,
                body: {
                    allocations: entries.map(([blockId, amount]) => ({
                        blockId,
                        amount,
                        version: versionOf(blockId),
                    })),
                    // 남은 돈은 나눌 돈에 그대로 남긴다. (홈 블록에 남는 돈)
                    leftoverTo: 'KEEP',
                },
            },
            {
                onSuccess: () => router.back(),
                onError: (error) => {
                    if (!(error instanceof ApiError)) {
                        Alert.alert('나누지 못했어요', '잠시 후 다시 시도해 주세요');
                        return;
                    }
                    switch (error.code) {
                        case WAITING_FUND_ERROR_CODE.VERSION_CONFLICT:
                            Alert.alert(
                                '블록 잔액이 바뀌었어요',
                                '바뀐 잔액으로 다시 계산했어요. 확인하고 다시 눌러 주세요',
                            );
                            simulation.refetch();
                            return;
                        case WAITING_FUND_ERROR_CODE.NOT_FOUND:
                            Alert.alert('나눌 돈이 없어요', '이미 다 나눴을 수 있어요', [
                                { text: '확인', onPress: router.back },
                            ]);
                            return;
                        default:
                            Alert.alert('나누지 못했어요', error.message);
                    }
                },
            },
        );
    };

    const footer = isOver
        ? { text: `${formatWon(-remaining)} 더 넣었어요. 줄이면 나눌 수 있어요`, isError: true }
        : blockedReason
          ? { text: blockedReason, isError: true }
          : allocatedTotal === 0
            ? { text: '넣을 금액을 적어 주세요', isError: false }
            : remaining === 0
              ? { text: `다 나누면 홈의 ${waitingFund.label} 블록이 사라져요`, isError: false }
              : {
                    text: `남은 ${formatWon(remaining)}은 홈의 ${waitingFund.label} 블록에 남아요`,
                    isError: false,
                };

    return (
        <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerClassName="px-5 pb-6 pt-1"
                keyboardShouldPersistTaps="handled"
            >
                <AllocationSummaryCard draft={draft} />

                <AppText className="mt-5 font-bold text-15">어디에 넣을까요?</AppText>
                <SegmentedControl
                    size="md"
                    options={MODE_OPTIONS}
                    value={mode}
                    onChange={handleChangeMode}
                    className="mt-3"
                />

                <View className="mt-3 overflow-hidden rounded-16 border border-line">
                    {targets.map((target, index) => (
                        <AllocationTargetRow
                            key={target.blockId}
                            target={target}
                            amount={amounts[target.blockId] ?? null}
                            onChangeAmount={(amount) => handleChangeAmount(target.blockId, amount)}
                            isLast={index === targets.length - 1}
                        />
                    ))}
                </View>

                {result && result.items.length > 0 && (
                    <ImpactList
                        title="배분하면 이렇게 바뀌어요"
                        items={result.items}
                        className={cn('mt-4', simulation.isStale && 'opacity-60')}
                    />
                )}
            </ScrollView>

            <View className="border-t border-line px-5 pb-4 pt-3">
                <View className="flex-row items-center justify-between">
                    <AppText className="text-15 text-ink-sub">
                        {waitingFund.label} 블록에 남는 돈
                    </AppText>
                    <View className="flex-row items-center gap-1">
                        <AmountText
                            amount={remaining}
                            className={cn(
                                'text-15',
                                isOver && 'text-danger-text',
                                remaining === 0 && 'text-primary-700',
                            )}
                        />
                        {remaining === 0 && (
                            <Icon name="check" size={14} color={colors.primary[700]} />
                        )}
                    </View>
                </View>
                <Button
                    title={allocatedTotal > 0 ? `${formatWon(allocatedTotal)} 나누기` : '나누기'}
                    loadingTitle="나누는 중"
                    isLoading={allocate.isPending}
                    disabled={!canSubmit}
                    onPress={handleSubmit}
                    className="mt-3"
                />
                <AppText
                    className={cn(
                        'mt-2 text-center text-12',
                        footer.isError ? 'text-danger-text' : 'text-ink-sub',
                    )}
                    accessibilityLiveRegion={footer.isError ? 'polite' : undefined}
                >
                    {footer.text}
                </AppText>
            </View>
        </KeyboardAvoidingView>
    );
}
