import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, View } from 'react-native';

import { AppText } from '@/shared/components/ui/AppText';
import { getWaterColor } from '@/shared/components/ui/BlockBeaker';
import { Button } from '@/shared/components/ui/Button';
import { colors } from '@/styles/tokens';

import { mergeTransactionDays } from '@/features/transaction/api/transactionMapper';
import { useReviewTransactionMutation } from '@/features/transaction/api/useReviewTransactionMutation';
import { useTransactionListQuery } from '@/features/transaction/api/useTransactionListQuery';
import { AgentQuestionBanner } from '@/features/transaction/components/AgentQuestionBanner';
import { ContextQuestionSheet } from '@/features/transaction/components/ContextQuestionSheet';
import { FilterPickerSheet } from '@/features/transaction/components/FilterPickerSheet';
import { MonthNavigator } from '@/features/transaction/components/MonthNavigator';
import { TransactionDaySection } from '@/features/transaction/components/TransactionDaySection';
import { TransactionFilterBar } from '@/features/transaction/components/TransactionFilterBar';
import { TransactionSummaryCard } from '@/features/transaction/components/TransactionSummaryCard';
import type {
    TransactionItem,
    TransactionListParams,
    TransactionStatusFilter,
} from '@/features/transaction/types/transaction';

type OpenSheet = 'QUESTION' | 'BLOCK' | 'ACCOUNT' | null;

interface TransactionListContentProps {
    params: TransactionListParams;
    onChangeMonth: (month: string) => void;
    onChangeStatus: (status: TransactionStatusFilter) => void;
    onChangeBlock: (blockId: number | null) => void;
    onChangeAccount: (accountId: number | null) => void;
}

/** 09 거래 목록 (계좌를 고르면 09-2 계좌별 내역) */
export function TransactionListContent({
    params,
    onChangeMonth,
    onChangeStatus,
    onChangeBlock,
    onChangeAccount,
}: TransactionListContentProps) {
    const query = useTransactionListQuery(params);
    const review = useReviewTransactionMutation();
    const [openSheet, setOpenSheet] = useState<OpenSheet>(null);

    if (query.isPending) {
        return (
            <View className="flex-1 items-center justify-center">
                <ActivityIndicator color={colors.primary[700]} />
            </View>
        );
    }

    if (query.isError) {
        return (
            <View className="flex-1 items-center justify-center gap-4 px-5">
                <AppText className="text-ink-sub">거래 내역을 불러오지 못했어요</AppText>
                <Button
                    title="다시 시도"
                    variant="secondary"
                    size="md"
                    onPress={() => query.refetch()}
                />
            </View>
        );
    }

    // 합계·칩 숫자·질문·필터 목록은 첫 쪽 값을 쓴다.
    const [firstPage] = query.data.pages;
    const { period, summary, counts, agentQuestion, filterOptions } = firstPage;
    const days = mergeTransactionDays(query.data.pages);

    const selectedBlock = filterOptions.blocks.find(({ blockId }) => blockId === params.blockId);
    const selectedAccount = filterOptions.accounts.find(
        ({ linkedAccountId }) => linkedAccountId === params.accountId,
    );

    const spentCaption = selectedAccount
        ? selectedAccount.label
        : summary.pendingCount > 0
          ? `임시 ${summary.pendingCount}건 포함`
          : null;
    const incomeCaption = summary.nextExpectedIncome
        ? `${summary.nextExpectedIncome.label} ${Number(summary.nextExpectedIncome.expectedDate.slice(8, 10))}일 예정`
        : null;

    // 질문 시트는 지금 물어볼 질문(agentQuestion) 하나만 연다. 누른 거래의 질문이 그것일 때만 연다.
    const handlePressTransaction = (transaction: TransactionItem) => {
        if (
            agentQuestion &&
            transaction.review?.type === 'CATEGORY_QUESTION' &&
            transaction.review.questionId === agentQuestion.questionId
        ) {
            setOpenSheet('QUESTION');
        }
    };

    const handleReview = (transactionId: number, action: 'KEEP' | 'DELETE') => {
        const submit = () =>
            review.mutate(
                { transactionId, action },
                {
                    onError: () =>
                        Alert.alert(
                            action === 'KEEP' ? '유지하지 못했어요' : '지우지 못했어요',
                            '잠시 후 다시 시도해 주세요.',
                        ),
                },
            );

        if (action === 'KEEP') {
            submit();
            return;
        }
        Alert.alert('이 거래를 지울까요?', '쓴 돈과 블록 잔액에서도 빠져요.', [
            { text: '취소', style: 'cancel' },
            { text: '삭제', style: 'destructive', onPress: submit },
        ]);
    };

    const header = (
        <View className="pb-4">
            <View className="-mx-5">
                <MonthNavigator
                    month={period.month}
                    canGoNext={!period.isCurrentMonth}
                    onChange={onChangeMonth}
                    caption={`${Number(period.startDate.slice(8, 10))}일 ~ ${Number(period.endDate.slice(8, 10))}일`}
                />
            </View>
            <View className="mt-3.5">
                <TransactionSummaryCard
                    spentAmount={summary.spentAmount}
                    spentCaption={spentCaption}
                    incomeAmount={summary.incomeAmount}
                    incomeCaption={incomeCaption}
                />
            </View>
            {agentQuestion && (
                <View className="mt-3">
                    <AgentQuestionBanner
                        message={agentQuestion.bannerMessage}
                        onPress={() => setOpenSheet('QUESTION')}
                    />
                </View>
            )}
            <View className="mt-4">
                <TransactionFilterBar
                    status={params.status}
                    counts={counts}
                    blockName={selectedBlock?.name ?? null}
                    accountName={selectedAccount?.institutionName ?? null}
                    onChangeStatus={onChangeStatus}
                    onPressBlock={() => setOpenSheet('BLOCK')}
                    onPressAccount={() => setOpenSheet('ACCOUNT')}
                />
            </View>
        </View>
    );

    return (
        <>
            <FlatList
                data={days}
                keyExtractor={(day) => day.date}
                renderItem={({ item }) => (
                    <TransactionDaySection
                        day={item}
                        today={period.today}
                        onPressTransaction={handlePressTransaction}
                        onReview={handleReview}
                        reviewingId={
                            review.isPending ? (review.variables?.transactionId ?? null) : null
                        }
                    />
                )}
                ItemSeparatorComponent={() => <View className="h-4" />}
                ListHeaderComponent={header}
                ListEmptyComponent={
                    <AppText className="py-16 text-center text-13 text-ink-sub">
                        {params.status === 'ALL'
                            ? '이 달에는 거래가 없어요'
                            : '조건에 맞는 거래가 없어요'}
                    </AppText>
                }
                ListFooterComponent={
                    query.hasNextPage ? (
                        <View className="mt-4 items-center">
                            {query.isFetchingNextPage ? (
                                <ActivityIndicator color={colors.primary[700]} />
                            ) : (
                                <Pressable
                                    accessibilityRole="button"
                                    hitSlop={14}
                                    onPress={() => query.fetchNextPage()}
                                    className="active:opacity-60"
                                >
                                    <AppText className="text-12 text-ink-sub">
                                        이전 거래 더 보기
                                    </AppText>
                                </Pressable>
                            )}
                        </View>
                    ) : null
                }
                contentContainerClassName="px-5 pb-8 pt-[22px]"
            />

            <ContextQuestionSheet
                question={agentQuestion}
                isOpen={openSheet === 'QUESTION'}
                onClose={() => setOpenSheet(null)}
            />
            <FilterPickerSheet
                isOpen={openSheet === 'BLOCK'}
                onClose={() => setOpenSheet(null)}
                title="블록 고르기"
                allLabel="전체 블록"
                options={filterOptions.blocks.map((block) => ({
                    id: block.blockId,
                    label: block.name,
                    dotColor: getWaterColor(block.color, block.status),
                }))}
                selectedId={params.blockId}
                onSelect={onChangeBlock}
            />
            <FilterPickerSheet
                isOpen={openSheet === 'ACCOUNT'}
                onClose={() => setOpenSheet(null)}
                title="계좌 고르기"
                allLabel="전체 계좌"
                options={filterOptions.accounts.map((account) => ({
                    id: account.linkedAccountId,
                    label: account.label,
                }))}
                selectedId={params.accountId}
                onSelect={onChangeAccount}
            />
        </>
    );
}
