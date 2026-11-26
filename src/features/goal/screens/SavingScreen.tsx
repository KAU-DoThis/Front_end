import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { formatWon } from '@/lib/format';
import { Screen } from '@/shared/components/layout/Screen';
import { AppText } from '@/shared/components/ui/AppText';
import { ScreenState } from '@/shared/components/ui/ScreenState';

import {
    useDismissSavingSuggestionMutation,
    useDismissingSuggestionIds,
} from '@/features/goal/api/useDismissSavingSuggestionMutation';
import {
    useIncludeExcludedSpendingMutation,
    useIncludingTransactionIds,
} from '@/features/goal/api/useIncludeExcludedSpendingMutation';
import { useSavingOverviewQuery } from '@/features/goal/api/useSavingOverviewQuery';
import { useSavingSuggestionsQuery } from '@/features/goal/api/useSavingSuggestionsQuery';
import { ActiveSavingGoalsCard } from '@/features/goal/components/ActiveSavingGoalsCard';
import { ConfirmedSavingBanner } from '@/features/goal/components/ConfirmedSavingBanner';
import { ExcludedSpendingRow } from '@/features/goal/components/ExcludedSpendingRow';
import { SavingSuggestionCard } from '@/features/goal/components/SavingSuggestionCard';
import { SetSavingGoalSheet } from '@/features/goal/components/SetSavingGoalSheet';
import type {
    ExcludedSpending,
    SavingOverview,
    SavingSuggestionList,
} from '@/features/goal/types/saving';

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 한국 시간 기준 이번 달 (헤더 "10월") */
const currentMonth = () => new Date(Date.now() + KST_OFFSET_MS).getUTCMonth() + 1;

const COUNT_WORDS: Record<number, string> = { 2: '둘 다', 3: '셋 다', 4: '넷 다' };

/** "최근 3달 평균과 비교했어요. 셋 다 세우면 월 약 79,500원 더 아껴요" */
function getSuggestionSummary(count: number, total: number) {
    const target = count === 1 ? '목표로' : (COUNT_WORDS[count] ?? `${count}개 다`);
    return `최근 3달 평균과 비교했어요. ${target} 세우면 월 약 ${formatWon(total)} 더 아껴요`;
}

/** 05 절약 · 확정 절약분 + 목표별 진행 + 절약 후보 (F-02) */
export function SavingScreen() {
    const overview = useSavingOverviewQuery();
    const suggestions = useSavingSuggestionsQuery();

    const handleRetry = () => {
        if (overview.isError) overview.refetch();
        if (suggestions.isError) suggestions.refetch();
    };

    return (
        <Screen edges={['top']}>
            <View className="px-5 pt-5">
                <AppText className="text-13 text-ink-sub">{currentMonth()}월</AppText>
                <AppText className="mt-1 font-bold text-24">절약</AppText>
            </View>
            {overview.isPending || suggestions.isPending ? (
                <ScreenState variant="loading" title="절약 현황을 불러오는 중이에요" />
            ) : overview.isError || suggestions.isError ? (
                <ScreenState
                    variant="error"
                    title="절약 현황을 불러오지 못했어요"
                    description="잠시 후 다시 시도해 주세요"
                    actionTitle="다시 시도"
                    onPressAction={handleRetry}
                />
            ) : (
                <SavingContent overview={overview.data} suggestionList={suggestions.data} />
            )}
        </Screen>
    );
}

interface SavingContentProps {
    overview: SavingOverview;
    suggestionList: SavingSuggestionList;
}

function SavingContent({ overview, suggestionList }: SavingContentProps) {
    const dismiss = useDismissSavingSuggestionMutation();
    const dismissingIds = useDismissingSuggestionIds();
    const include = useIncludeExcludedSpendingMutation();
    const includingIds = useIncludingTransactionIds();
    const { suggestions, excluded } = suggestionList;
    // 닫히는 동안에도 내용이 남아 있도록 고른 후보는 열림 상태와 따로 둔다.
    const [goalSuggestionId, setGoalSuggestionId] = useState<number | null>(null);
    const [isGoalSheetOpen, setIsGoalSheetOpen] = useState(false);
    const [goalFormKey, setGoalFormKey] = useState(0);

    const handleSetGoal = (suggestionId: number) => {
        setGoalSuggestionId(suggestionId);
        setGoalFormKey((key) => key + 1);
        setIsGoalSheetOpen(true);
    };

    const handleDismiss = (suggestionId: number) => {
        // 같은 후보를 보내는 중이면 다시 보내지 않는다.
        if (dismissingIds.includes(suggestionId)) return;
        // mutate에 넘긴 콜백은 연달아 누르면 마지막 것만 불려서, 호출마다 결과를 받는다.
        dismiss.mutateAsync(suggestionId).catch(() => {
            Alert.alert('관심 없음으로 바꾸지 못했어요', '잠시 후 다시 시도해 주세요');
        });
    };

    /** 묶인 거래 중 하나라도 보내는 중이면 그 줄은 보내는 중으로 본다. */
    const isIncludingItem = (item: ExcludedSpending) =>
        item.transactionIds.some((id) => includingIds.includes(id));

    const handleInclude = (item: ExcludedSpending) => {
        if (isIncludingItem(item)) return;
        include.mutateAsync(item.transactionIds).catch(() => {
            Alert.alert('다시 포함하지 못했어요', '잠시 후 다시 시도해 주세요');
        });
    };

    const handleSplit = (waitingFundId: number) => {
        router.push({
            pathname: '/allocation/[waitingFundId]',
            params: { waitingFundId: String(waitingFundId) },
        });
    };

    const handlePressAnalysis = () => {
        router.navigate({ pathname: '/transactions', params: { tab: 'ANALYSIS' } });
    };

    return (
        <ScrollView contentContainerClassName="px-5 pb-10 pt-4">
            {overview.confirmed && (
                <ConfirmedSavingBanner confirmed={overview.confirmed} onSplit={handleSplit} />
            )}

            <View className={overview.confirmed ? 'mt-3' : undefined}>
                {overview.activeGoals && overview.activeGoals.goals.length > 0 ? (
                    <ActiveSavingGoalsCard activeGoals={overview.activeGoals} />
                ) : (
                    <View className="rounded-16 bg-surface-neutral px-4 py-5">
                        <AppText className="font-semibold text-15">
                            진행 중인 절약 목표가 없어요
                        </AppText>
                        <AppText className="mt-1 text-13 text-ink-sub">
                            아래 줄일 수 있는 지출에서 목표를 세워 보세요
                        </AppText>
                    </View>
                )}
            </View>

            <View className="mt-6 flex-row items-center justify-between">
                <AppText className="font-bold text-17">
                    줄일 수 있는 지출 {overview.suggestionCount}개
                </AppText>
                <Pressable accessibilityRole="link" hitSlop={12} onPress={handlePressAnalysis}>
                    <AppText className="font-semibold text-13">소비 분석</AppText>
                </Pressable>
            </View>
            {suggestions.length > 0 ? (
                <>
                    <AppText className="mt-1 text-13 text-ink-sub">
                        {getSuggestionSummary(overview.suggestionCount, overview.suggestionTotal)}
                    </AppText>
                    <View className="mt-3 gap-2">
                        {suggestions.map((suggestion) => (
                            <SavingSuggestionCard
                                key={suggestion.suggestionId}
                                suggestion={suggestion}
                                isDismissing={dismissingIds.includes(suggestion.suggestionId)}
                                onDismiss={handleDismiss}
                                onSetGoal={handleSetGoal}
                            />
                        ))}
                    </View>
                </>
            ) : (
                <AppText className="mt-1 text-13 text-ink-sub">
                    지금은 3달 평균보다 크게 늘어난 지출이 없어요
                </AppText>
            )}

            {excluded.length > 0 && (
                <View className="mt-5">
                    <AppText className="font-bold text-15">후보에서 뺀 지출</AppText>
                    <View className="mt-2 gap-2">
                        {excluded.map((item) => (
                            <ExcludedSpendingRow
                                key={item.transactionIds.join('-')}
                                item={item}
                                isIncluding={isIncludingItem(item)}
                                onInclude={handleInclude}
                            />
                        ))}
                    </View>
                </View>
            )}

            <SetSavingGoalSheet
                isOpen={isGoalSheetOpen}
                onClose={() => setIsGoalSheetOpen(false)}
                suggestionId={goalSuggestionId}
                formKey={goalFormKey}
            />
        </ScrollView>
    );
}
