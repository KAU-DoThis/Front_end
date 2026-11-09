import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { AppText } from '@/shared/components/ui/AppText';
import { Button } from '@/shared/components/ui/Button';
import { SuggestionCard } from '@/shared/components/ui/SuggestionCard';
import { colors } from '@/styles/tokens';

import { useSpendingAnalysisQuery } from '@/features/transaction/api/useSpendingAnalysisQuery';
import { MonthNavigator } from '@/features/transaction/components/MonthNavigator';
import { RecurringSpendingCard } from '@/features/transaction/components/RecurringSpendingCard';
import { RichTextView } from '@/features/transaction/components/RichTextView';
import { SpendingOverviewCard } from '@/features/transaction/components/SpendingOverviewCard';
import { TimeOfDayCard } from '@/features/transaction/components/TimeOfDayCard';
import { TopIncreaseCard } from '@/features/transaction/components/TopIncreaseCard';

interface SpendingAnalysisContentProps {
    /** yyyy-MM (null이면 이번 달) — 거래 목록 탭과 같이 쓴다. */
    month: string | null;
    onChangeMonth: (month: string) => void;
}

/** 11 소비 분석 */
export function SpendingAnalysisContent({ month, onChangeMonth }: SpendingAnalysisContentProps) {
    const { data: analysis, isPending, isError, refetch } = useSpendingAnalysisQuery(month);

    if (isPending) {
        return (
            <View className="flex-1 items-center justify-center">
                <ActivityIndicator color={colors.primary[700]} />
            </View>
        );
    }

    if (isError) {
        return (
            <View className="flex-1 items-center justify-center gap-4 px-5">
                <AppText className="text-ink-sub">소비 분석을 불러오지 못했어요</AppText>
                <Button title="다시 시도" variant="secondary" size="md" onPress={() => refetch()} />
            </View>
        );
    }

    const hasSpending = analysis.categories.length > 0;

    return (
        <ScrollView contentContainerClassName="pb-8 pt-[22px]">
            <MonthNavigator
                month={analysis.month}
                canGoNext={!analysis.isCurrentMonth}
                onChange={onChangeMonth}
                caption={`${analysis.compareLabel}과 비교`}
            />
            <View className="mt-[18px] gap-3 px-5">
                {hasSpending ? (
                    <SpendingOverviewCard analysis={analysis} />
                ) : (
                    <AppText className="py-16 text-center text-13 text-ink-sub">
                        이 달에는 분석할 지출이 없어요
                    </AppText>
                )}
                {analysis.topIncrease && (
                    <TopIncreaseCard
                        compareLabel={analysis.compareLabel}
                        topIncrease={analysis.topIncrease}
                    />
                )}
                {analysis.timeOfDay && <TimeOfDayCard timeOfDay={analysis.timeOfDay} />}
                {analysis.recurring.length > 0 && (
                    <RecurringSpendingCard items={analysis.recurring} />
                )}
                {analysis.savingTip && (
                    <SuggestionCard
                        message={
                            <RichTextView
                                parts={analysis.savingTip.message}
                                className="text-15 leading-[23px]"
                            />
                        }
                        actions={[
                            {
                                title: '절약 후보 보기',
                                variant: 'primary',
                                // TODO: 절약 후보 화면이 생기면 그쪽으로 보낸다. 지금은 절약 탭을 연다.
                                onPress: () => router.push('/saving'),
                            },
                        ]}
                    />
                )}
            </View>
        </ScrollView>
    );
}
