import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatAmount, formatDayHeader } from '@/lib/format';
import { AppText } from '@/shared/components/ui/AppText';
import { Button } from '@/shared/components/ui/Button';
import { colors } from '@/styles/tokens';

import { mergeTransactionDays } from '@/features/transaction/api/transactionMapper';
import { useTransactionListQuery } from '@/features/transaction/api/useTransactionListQuery';
import { DutchPayTransactionRow } from '@/features/transaction/components/DutchPayTransactionRow';
import { MonthNavigator } from '@/features/transaction/components/MonthNavigator';
import type { TransactionItem } from '@/features/transaction/types/transaction';

interface DutchPayPickerProps {
    /** 결제(OUT)를 고르는지, 받은 돈(IN)을 고르는지 */
    direction: 'IN' | 'OUT';
    /** 지금 시트에 들어 있는 거래 (처음에 골라진 상태로 보여준다) */
    selected: TransactionItem[];
    /** 수정 중인 더치페이. 이 더치페이에 묶인 거래는 고를 수 있다. */
    dutchPayId: number | null;
    /** 처음 보여줄 달 (yyyy-MM) */
    initialMonth: string | null;
    onConfirm: (items: TransactionItem[]) => void;
}

/**
 * 03-4a 받은 돈 고르기 · 03-4a′ 결제 고르기 (내용만).
 * 더치페이 시트 안에서 한 단계 들어간 화면이라 시트(제목·뒤로 가기)는 DutchPaySheet가 그린다.
 */
export function DutchPayPicker({
    direction,
    selected,
    dutchPayId,
    initialMonth,
    onConfirm,
}: DutchPayPickerProps) {
    const { t } = useTranslation('transaction');
    const [month, setMonth] = useState(initialMonth);
    // 달을 넘겨도 고른 거래가 남도록 거래 자체를 들고 있는다.
    const [picked, setPicked] = useState(
        () => new Map(selected.map((item) => [item.transactionId, item])),
    );
    const query = useTransactionListQuery({
        month,
        status: 'ALL',
        blockId: null,
        accountId: null,
    });

    const isPayment = direction === 'OUT';
    const firstPage = query.data?.pages[0];
    // 방향이 맞고, 쓴 돈에서 뺀 거래가 아니고, 다른 더치페이에 묶이지 않은 거래만 고를 수 있다.
    const days = mergeTransactionDays(query.data?.pages ?? [])
        .map((day) => ({
            ...day,
            transactions: day.transactions.filter(
                (item) =>
                    item.direction === direction &&
                    !item.isExcluded &&
                    (item.dutchPayId === null || item.dutchPayId === dutchPayId),
            ),
        }))
        .filter((day) => day.transactions.length > 0);

    const toggle = (item: TransactionItem) => {
        setPicked((previous) => {
            const next = new Map(previous);
            if (next.has(item.transactionId)) {
                next.delete(item.transactionId);
            } else {
                next.set(item.transactionId, item);
            }
            return next;
        });
    };

    const pickedItems = [...picked.values()].sort((a, b) =>
        b.occurredAt.localeCompare(a.occurredAt),
    );
    const pickedTotal = pickedItems.reduce((sum, { amount }) => sum + amount, 0);

    return (
        <>
            {firstPage && (
                <View className="-mx-5">
                    <MonthNavigator
                        month={firstPage.period.month}
                        canGoNext={!firstPage.period.isCurrentMonth}
                        onChange={setMonth}
                    />
                </View>
            )}

            {query.isPending ? (
                <View className="items-center py-16">
                    <ActivityIndicator color={colors.primary[700]} />
                </View>
            ) : query.isError ? (
                <View className="items-center gap-3 py-16">
                    <AppText className="text-13 text-ink-sub">
                        {t('dutchPay.picker.loadError')}
                    </AppText>
                    <Button
                        title={t('action.retry', { ns: 'common' })}
                        variant="secondary"
                        size="sm"
                        onPress={() => query.refetch()}
                    />
                </View>
            ) : (
                <View className="mt-4 gap-4">
                    {days.length === 0 && (
                        <AppText className="py-12 text-center text-13 text-ink-sub">
                            {t('dutchPay.picker.empty')}
                        </AppText>
                    )}
                    {days.map((day) => (
                        <View key={day.date} className="gap-2">
                            <AppText className="font-bold text-13">
                                {formatDayHeader(day.date, firstPage?.period.today ?? day.date)}
                            </AppText>
                            <View className="overflow-hidden rounded-16 border border-line bg-white">
                                {day.transactions.map((item, index) => (
                                    <DutchPayTransactionRow
                                        key={item.transactionId}
                                        transaction={item}
                                        isLast={index === day.transactions.length - 1}
                                        showDate={false}
                                        isSelected={picked.has(item.transactionId)}
                                        onPress={() => toggle(item)}
                                    />
                                ))}
                            </View>
                        </View>
                    ))}
                    {query.hasNextPage && (
                        <View className="items-center">
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
                                        {t('dutchPay.picker.more')}
                                    </AppText>
                                </Pressable>
                            )}
                        </View>
                    )}
                    <AppText className="px-1 text-12 text-ink-sub">
                        {t(
                            isPayment
                                ? 'dutchPay.picker.paymentsHidden'
                                : 'dutchPay.picker.receivedHidden',
                        )}
                    </AppText>
                </View>
            )}

            <View className="mt-6 flex-row items-center gap-3">
                <View className="flex-1">
                    <AppText className="text-12 text-ink-sub">
                        {t('dutchPay.picker.count', { count: pickedItems.length })}
                    </AppText>
                    <AppText className="font-bold text-20">
                        {t('dutchPay.amount', {
                            amount: formatAmount(pickedTotal, { showUnit: false }),
                        })}
                    </AppText>
                </View>
                <Button
                    title={t('dutchPay.picker.pick')}
                    className="w-[150px]"
                    onPress={() => onConfirm(pickedItems)}
                />
            </View>
        </>
    );
}
