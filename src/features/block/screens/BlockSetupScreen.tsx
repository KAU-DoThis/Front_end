import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, BackHandler, Pressable, ScrollView, View } from 'react-native';

import { useBlockSetupPreviewQuery } from '@/features/block/api/useBlockSetupPreviewQuery';
import { useBlockSetupProposalQuery } from '@/features/block/api/useBlockSetupProposalQuery';
import { useCreateSetupBlocksMutation } from '@/features/block/api/useCreateSetupBlocksMutation';
import { SetupBlockCard } from '@/features/block/components/SetupBlockCard';
import { getSetupBlockErrors } from '@/features/block/components/SetupBlockFields';
import { SetupSummaryCard } from '@/features/block/components/SetupSummaryCard';
import { useBlockSetupDraft } from '@/features/block/hooks/useBlockSetupDraft';
import { cn } from '@/lib/cn';
import { formatAmount } from '@/lib/format';
import { OnboardingHeader } from '@/shared/components/layout/OnboardingHeader';
import { Screen } from '@/shared/components/layout/Screen';
import { AppText } from '@/shared/components/ui/AppText';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Chip } from '@/shared/components/ui/Chip';
import { Icon } from '@/shared/components/ui/Icon';
import { Mascot } from '@/shared/components/ui/Mascot';
import { ScreenState } from '@/shared/components/ui/ScreenState';
import { ONBOARDING_STEP, ONBOARDING_TOTAL_STEPS } from '@/shared/constants/onboarding';
import { useDelayedFlag } from '@/shared/hooks/useDelayedFlag';
import { ApiError } from '@/shared/types/api';
import { colors } from '@/styles/tokens';

/** CODEF 응답이 이보다 오래 걸리면 늦어지고 있다고 알려준다. (디자인 시스템 '화면 상태') */
const SLOW_RESPONSE_MS = 30_000;

/** 거래만으로는 목적을 알 수 없어 직접 만들도록 권하는 목표형 블록 */
const GOAL_SUGGESTIONS = ['저축', '비상금', '여행'];

interface BlockSetupScreenProps {
    /** 연결하지 못해 거래를 빼고 나눈 기관 이름 (모두 연결됐으면 빈 배열) */
    missingInstitutionNames: string[];
    /** 블록을 만들고 나면 부른다. (온보딩을 마치고 홈으로 간다) */
    onComplete: () => void;
    /** 닫기를 확인하면 부른다. */
    onExit: () => void;
}

/** 04 블록 구성 (온보딩 3/3): AI가 나눈 블록을 고치고 확정한다. 확정 전에는 아무것도 저장하지 않는다. */
export function BlockSetupScreen({
    missingInstitutionNames,
    onComplete,
    onExit,
}: BlockSetupScreenProps) {
    const proposalQuery = useBlockSetupProposalQuery();
    const proposal = proposalQuery.data;
    const draft = useBlockSetupDraft(proposal?.blocks);
    const previewQuery = useBlockSetupPreviewQuery(draft.request);
    const preview = previewQuery.data?.preview;
    const { mutate: createBlocks, isPending, isError, isSuccess } = useCreateSetupBlocksMutation();

    // null이면 처음 상태: 첫 블록만 펼친다.
    const [expandedKeys, setExpandedKeys] = useState<Set<string> | null>(null);
    const [activeKey, setActiveKey] = useState<string | null>(null);
    // 확정을 한 번 누른 뒤부터 비어 있는 칸을 오류로 보여준다.
    const [isSubmitted, setIsSubmitted] = useState(false);

    const isSlow = useDelayedFlag(proposalQuery.isPending, SLOW_RESPONSE_MS);

    // 블록을 만드는 중에는 Android 뒤로 가기를 막는다.
    useEffect(() => {
        if (!isPending) return;
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
        return () => subscription.remove();
    }, [isPending]);

    const handleClose = () => {
        Alert.alert(
            '블록 구성을 그만둘까요?',
            '고친 내용은 저장되지 않아요. 로그아웃하고 처음 화면으로 돌아가요.',
            [
                { text: '계속 고치기', style: 'cancel' },
                { text: '로그아웃', style: 'destructive', onPress: onExit },
            ],
        );
    };

    const header = (
        <>
            <Stack.Screen options={{ gestureEnabled: !isPending }} />
            <OnboardingHeader
                step={ONBOARDING_STEP.BLOCK_SETUP}
                totalSteps={ONBOARDING_TOTAL_STEPS}
                onClose={handleClose}
                isCloseDisabled={isPending}
            />
        </>
    );

    if (proposalQuery.isPending) {
        return (
            <Screen>
                {header}
                <ScreenState
                    variant="loading"
                    title="데이터를 가져오는 중이에요"
                    description={
                        isSlow
                            ? '은행 응답이 늦어지고 있어요. 조금만 더 기다려 주세요'
                            : '3개월 거래를 보고 블록을 나누고 있어요'
                    }
                />
            </Screen>
        );
    }

    if (proposalQuery.isError || !proposal || !draft.blocks) {
        return (
            <Screen>
                {header}
                <ScreenState
                    variant="error"
                    title="블록을 나누지 못했어요"
                    description="거래 내역을 가져오지 못했어요. 잠시 후 다시 시도해 주세요"
                    actionTitle="다시 시도"
                    onPressAction={() => proposalQuery.refetch()}
                />
            </Screen>
        );
    }

    const blocks = draft.blocks;
    const expanded = expandedKeys ?? new Set(blocks[0] ? [blocks[0].key] : []);
    const currentActiveKey = activeKey ?? blocks[0]?.key ?? null;
    const errorsByKey = new Map(blocks.map((block) => [block.key, getSetupBlockErrors(block)]));
    const hasErrors = [...errorsByKey.values()].some((errors) => Object.keys(errors).length > 0);
    const goalSuggestions = GOAL_SUGGESTIONS.filter(
        (name) => !blocks.some((block) => block.name === name),
    );

    const expand = (key: string) => {
        setExpandedKeys(new Set(expanded).add(key));
        setActiveKey(key);
    };

    const handleToggleExpand = (key: string) => {
        if (!expanded.has(key)) {
            expand(key);
            return;
        }
        const next = new Set(expanded);
        next.delete(key);
        setExpandedKeys(next);
    };

    const handleAddBlock = (name: string) => {
        const key = draft.add({ type: name === '' ? 'SPENDING' : 'GOAL', name });
        expand(key);
    };

    const handleReset = () => {
        draft.reset();
        setExpandedKeys(null);
        setActiveKey(null);
        setIsSubmitted(false);
    };

    const handleSubmit = () => {
        // 만들고 나서 홈으로 넘어가기 전(온보딩 기록 정리 중)에 다시 눌러 블록이 두 번 만들어지지 않게 막는다.
        if (isSuccess) return;
        setIsSubmitted(true);
        if (hasErrors || isPending || !draft.request) {
            // 고칠 칸이 있는 블록을 펼쳐 바로 보이게 한다.
            const invalidKeys = blocks
                .filter((block) => Object.keys(errorsByKey.get(block.key) ?? {}).length > 0)
                .map(({ key }) => key);
            setExpandedKeys(new Set([...expanded, ...invalidKeys]));
            return;
        }
        // 화면에 보이는 합계·경고가 지금 고친 내용으로 계산된 뒤에만 만든다.
        if (!previewQuery.isCurrent) return;
        createBlocks(draft.request, {
            onSuccess: onComplete,
            // 확정 응답을 못 받고 다시 누른 경우: 이미 만들어졌으니 넘어간다.
            onError: (error) => {
                if (
                    error instanceof ApiError &&
                    error.code === 'BLOCK_PROPOSAL_ALREADY_CONFIRMED'
                ) {
                    onComplete();
                }
            },
        });
    };

    // 고칠 칸이 있으면 눌러서 어디인지 볼 수 있게 열어 두고, 없으면 합계 계산이 끝날 때까지 막는다.
    const isWaitingPreview = !hasErrors && !previewQuery.isCurrent;

    const footerMessage = isError
        ? { text: '블록을 만들지 못했어요. 잠시 후 다시 시도해 주세요', isError: true }
        : isSubmitted && hasErrors
          ? { text: '빨갛게 표시된 칸을 채우면 시작할 수 있어요', isError: true }
          : isWaitingPreview && previewQuery.isError
            ? { text: '합계를 다시 계산하면 시작할 수 있어요', isError: true }
            : { text: '시작하기 전엔 아무것도 저장되지 않아요', isError: false };

    return (
        <Screen>
            {header}
            <ScrollView
                contentContainerClassName="px-5 pb-6 pt-5"
                keyboardShouldPersistTaps="handled"
            >
                <View className="flex-row items-center gap-3">
                    <Mascot className="h-16 w-16 rounded-full border-2 border-primary-100 bg-primary-50" />
                    <AppText className="flex-1 font-bold text-24">
                        {'3개월 거래를 보고\n이렇게 나눠봤어요'}
                    </AppText>
                </View>
                <AppText className="mt-2 text-15 text-ink-sub">
                    {/* 거래 분석 전이면 수입을 모른다. */}
                    {proposal.monthlyIncome !== null && (
                        <>
                            {'월 평균 수입 '}
                            <AppText className="font-bold text-15">
                                {formatAmount(proposal.monthlyIncome)}
                            </AppText>
                            {'  '}
                        </>
                    )}
                    {`반복 송금·결제 ${proposal.recurringPaymentCount}건 발견`}
                </AppText>

                {/* 빠진 기관이 있으면 제안이 실제와 다를 수 있어 알려준다. */}
                {/* TODO: 나중에 연결을 더할 곳(설정 등)이 생기면 그 경로를 같이 안내한다. */}
                {missingInstitutionNames.length > 0 && (
                    <View
                        className="mt-4 gap-1 rounded-12 bg-caution-soft-bg p-3"
                        accessibilityLiveRegion="polite"
                    >
                        <AppText className="font-bold text-13 text-caution-body">
                            연결하지 못한 기관이 있어요
                        </AppText>
                        <AppText className="text-13 text-caution-body">
                            {`${missingInstitutionNames.join(', ')} 거래는 빼고 나눴어요`}
                        </AppText>
                    </View>
                )}

                <View className="mt-4">
                    <SetupSummaryCard
                        result={previewQuery.data}
                        blocks={blocks}
                        isError={previewQuery.isError}
                        onRetry={() => previewQuery.refetch()}
                    />
                </View>

                <View className="mt-6 flex-row items-center">
                    <AppText className="flex-1 text-13 text-ink-sub">눌러서 고칠 수 있어요</AppText>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ disabled: !draft.hasChanges }}
                        disabled={!draft.hasChanges}
                        hitSlop={12}
                        onPress={handleReset}
                        className="active:opacity-60"
                    >
                        <AppText
                            className={cn(
                                'font-semibold text-13',
                                draft.hasChanges ? 'text-primary-700' : 'text-ink-disabled',
                            )}
                        >
                            AI 제안으로 되돌리기
                        </AppText>
                    </Pressable>
                </View>

                <View className="mt-3 gap-3">
                    {blocks.map((block) => {
                        const proposed = draft.getProposed(block.key);
                        const blockPreview = preview?.blocks.find(({ key }) => key === block.key);
                        return (
                            <SetupBlockCard
                                key={block.key}
                                block={block}
                                isExpanded={expanded.has(block.key)}
                                isActive={currentActiveKey === block.key}
                                isModified={draft.isModified(block)}
                                errors={errorsByKey.get(block.key) ?? {}}
                                isErrorVisible={isSubmitted}
                                suggestedAmount={proposed?.amount ?? null}
                                dailyBudget={blockPreview?.dailyBudget ?? null}
                                warning={blockPreview?.warning ?? null}
                                onToggleExpand={() => handleToggleExpand(block.key)}
                                onChange={(patch) => draft.update(block.key, patch)}
                                onRemove={() => draft.remove(block.key)}
                            />
                        );
                    })}

                    {goalSuggestions.length > 0 && (
                        <Card variant="neutral" className="gap-1">
                            <AppText className="font-bold text-15">
                                저축·비상금·여행은 직접 만들어요
                            </AppText>
                            <AppText className="text-13 text-ink-sub">
                                거래 내역만으로는 모으는 목적을 알 수 없어서 AI가 나누지 않았어요.
                                지금 만들거나 나중에 홈에서 만들 수 있어요.
                            </AppText>
                            <View className="flex-row flex-wrap gap-2 pt-2">
                                {goalSuggestions.map((name) => (
                                    <Chip
                                        key={name}
                                        label={`+ ${name}`}
                                        onPress={() => handleAddBlock(name)}
                                    />
                                ))}
                            </View>
                        </Card>
                    )}

                    <Pressable
                        accessibilityRole="button"
                        onPress={() => handleAddBlock('')}
                        className="h-13.5 flex-row items-center justify-center gap-2 rounded-16 border border-dashed border-primary-300 active:bg-surface-neutral"
                    >
                        <Icon
                            name="plus"
                            size={18}
                            color={colors.primary[700]}
                            strokeWidth={1.65}
                        />
                        <AppText className="font-semibold text-15 text-primary-700">
                            블록 추가
                        </AppText>
                    </Pressable>
                </View>
            </ScrollView>

            <View className="gap-3 border-t border-line px-5 pb-6 pt-3">
                <AppText
                    className={cn(
                        'text-center text-12',
                        footerMessage.isError ? 'text-danger-text' : 'text-ink-sub',
                    )}
                    accessibilityLiveRegion={footerMessage.isError ? 'polite' : undefined}
                >
                    {footerMessage.text}
                </AppText>
                <Button
                    title="시작하기"
                    loadingTitle="블록 만드는 중"
                    // 성공한 뒤 홈으로 넘어갈 때까지 로딩을 이어서 보여준다.
                    isLoading={isPending || isSuccess}
                    disabled={isWaitingPreview}
                    onPress={handleSubmit}
                />
            </View>
        </Screen>
    );
}
