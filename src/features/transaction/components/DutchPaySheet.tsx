import { useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';
import { formatAmount } from '@/lib/format';
import { AppText } from '@/shared/components/ui/AppText';
import { BottomSheet, BottomSheetTextInput } from '@/shared/components/ui/BottomSheet';
import { Button } from '@/shared/components/ui/Button';
import { Icon } from '@/shared/components/ui/Icon';
import { ImpactList, type ImpactItem } from '@/shared/components/ui/ImpactList';
import { ApiError } from '@/shared/types/api';
import { colors, fontFamily } from '@/styles/tokens';

import { toDutchPayPreview } from '@/features/transaction/api/dutchPayMapper';
import { useDutchPayQuery } from '@/features/transaction/api/useDutchPayQuery';
import {
    useDeleteDutchPayMutation,
    useSaveDutchPayMutation,
} from '@/features/transaction/api/useDutchPayMutations';
import { DutchPayPicker } from '@/features/transaction/components/DutchPayPicker';
import { DutchPayTransactionRow } from '@/features/transaction/components/DutchPayTransactionRow';
import type { TransactionItem } from '@/features/transaction/types/transaction';

/** 금액 입력 최대 자릿수 (999억 원) */
const MAX_AMOUNT_DIGITS = 11;

/**
 * 어떤 더치페이를 여는지
 * - CREATE: 내역에서 결제 행을 밀어 열거나(09-3) 09-1 '나눠서 냄'에서 넘어왔다. 그 결제를 채워서 연다.
 * - EDIT: 더치페이 칩이 붙은 거래를 눌렀다. (03-4d 수정·해제)
 */
export type DutchPayTarget =
    { mode: 'CREATE'; payment: TransactionItem } | { mode: 'EDIT'; dutchPayId: number };

type Picking = 'OUT' | 'IN' | null;

const sortByLatest = (items: TransactionItem[]) =>
    [...items].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

interface DutchPaySheetProps {
    target: DutchPayTarget | null;
    isOpen: boolean;
    onClose: () => void;
}

/**
 * 03-4 더치페이 시트 (03-2 자금 이동 시트 재구성)
 * - 대표 결제(여러 건)와 정산으로 받은 입금(여러 건)을 고르면 내 몫 = 결제 합 - 받은 돈을 채운다. 내 몫은 언제든 고칠 수 있다.
 * - 결제 합 - 내 몫은 그 결제가 반영된 블록(생활비 등)에 돌려놓고, 남는 받은 돈은 나눌 돈(추가 입금)으로 간다.
 * - 받은 돈이 하나도 없으면 확정할 수 없다. 거래 금액은 그대로 두고 칩만 붙는다.
 */
export function DutchPaySheet({ target, isOpen, onClose }: DutchPaySheetProps) {
    const { t } = useTranslation('transaction');
    const shareInputRef = useRef<ComponentRef<typeof BottomSheetTextInput>>(null);
    const editId = target?.mode === 'EDIT' ? target.dutchPayId : null;
    const query = useDutchPayQuery(isOpen ? editId : null);
    const save = useSaveDutchPayMutation();
    const release = useDeleteDutchPayMutation();

    const [payments, setPayments] = useState<TransactionItem[]>([]);
    const [received, setReceived] = useState<TransactionItem[]>([]);
    /** 사용자가 고친 내 몫. 고치지 않았으면 null (결제 합 - 받은 돈) */
    const [editedShare, setEditedShare] = useState<number | null>(null);
    const [picking, setPicking] = useState<Picking>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // 시트를 열 때마다 처음 상태로 되돌린다. 수정이면 더치페이를 받아 온 뒤 한 번 채운다. (렌더 중 비교 — React 권장 방식)
    const [openedFor, setOpenedFor] = useState<DutchPayTarget | null>(null);
    const [loadedId, setLoadedId] = useState<number | null>(null);
    if (isOpen && target !== openedFor) {
        setOpenedFor(target);
        setLoadedId(null);
        setPayments(target?.mode === 'CREATE' ? [target.payment] : []);
        setReceived([]);
        setEditedShare(null);
        setPicking(null);
        setErrorMessage(null);
    }
    if (!isOpen && openedFor !== null) {
        setOpenedFor(null);
    }
    if (editId !== null && query.data && loadedId !== editId) {
        setLoadedId(editId);
        setPayments(sortByLatest(query.data.payments));
        setReceived(sortByLatest(query.data.received));
        setEditedShare(query.data.isMyShareEdited ? query.data.myShare : null);
    }

    const isEdit = editId !== null;
    const isLoading = isEdit && loadedId !== editId;
    const preview = toDutchPayPreview(payments, received, editedShare);
    const won = (amount: number) =>
        t('dutchPay.amount', { amount: formatAmount(amount, { showUnit: false }) });
    // 돌려놓는 블록 이름 (결제마다 다르면 첫 결제의 블록)
    const blockName =
        payments.find((item) => item.block)?.block?.name ?? t('dutchPay.check.defaultBlock');

    const handleChangeShare = (text: string) => {
        const digits = text.replace(/\D/g, '').slice(0, MAX_AMOUNT_DIGITS);
        setErrorMessage(null);
        setEditedShare(digits ? Number(digits) : 0);
    };

    const handlePicked = (items: TransactionItem[]) => {
        if (picking === 'OUT') {
            setPayments(items);
        } else {
            setReceived(items);
        }
        setPicking(null);
        setErrorMessage(null);
    };

    const canSubmit = !isLoading && payments.length > 0 && received.length > 0;
    const submitTitle =
        payments.length === 0
            ? t('dutchPay.needPayment')
            : received.length === 0
              ? t('dutchPay.needReceived')
              : t(isEdit ? 'dutchPay.save' : 'dutchPay.confirm');

    const handleSubmit = () => {
        if (!canSubmit) {
            return;
        }
        setErrorMessage(null);
        save.mutate(
            {
                dutchPayId: editId,
                paymentTransactionIds: payments.map(({ transactionId }) => transactionId),
                receivedTransactionIds: received.map(({ transactionId }) => transactionId),
                editedMyShare: editedShare,
            },
            {
                onSuccess: onClose,
                // 내 몫이 결제 합보다 크거나 다른 더치페이에 묶인 거래면 서버 문구를 그대로 보여준다.
                onError: (error) =>
                    setErrorMessage(
                        error instanceof ApiError && error.status && error.status < 500
                            ? error.message
                            : t('dutchPay.error.save'),
                    ),
            },
        );
    };

    const handleRelease = () => {
        if (editId === null) {
            return;
        }
        Alert.alert(t('dutchPay.releaseTitle'), t('dutchPay.releaseMessage'), [
            { text: t('action.cancel', { ns: 'common' }), style: 'cancel' },
            {
                text: t('dutchPay.release'),
                style: 'destructive',
                onPress: () =>
                    release.mutate(editId, {
                        onSuccess: onClose,
                        onError: () => setErrorMessage(t('dutchPay.error.release')),
                    }),
            },
        ]);
    };

    const isBusy = save.isPending || release.isPending;

    if (picking) {
        const isPayment = picking === 'OUT';
        const current = isPayment ? payments : received;
        const base = current[0] ?? payments[0];
        return (
            <BottomSheet
                isOpen={isOpen}
                onClose={onClose}
                onBack={() => setPicking(null)}
                title={t(
                    isPayment ? 'dutchPay.picker.paymentsTitle' : 'dutchPay.picker.receivedTitle',
                )}
                description={t(
                    isPayment
                        ? 'dutchPay.picker.paymentsDescription'
                        : 'dutchPay.picker.receivedDescription',
                )}
                scrollable
            >
                <DutchPayPicker
                    direction={picking}
                    selected={current}
                    dutchPayId={editId}
                    initialMonth={base ? base.occurredAt.slice(0, 7) : null}
                    onConfirm={handlePicked}
                />
            </BottomSheet>
        );
    }

    const checkItems: ImpactItem[] = [
        ...(preview.returned > 0
            ? [
                  {
                      type: 'returned',
                      severity: 'good' as const,
                      title: t('dutchPay.check.returned', {
                          block: blockName,
                          amount: won(preview.returned),
                      }),
                      detail: t('dutchPay.check.returnedDetail', {
                          paid: formatAmount(preview.paidTotal, { showUnit: false }),
                          share: formatAmount(preview.myShare, { showUnit: false }),
                      }),
                  } satisfies ImpactItem,
              ]
            : []),
        ...(preview.buffer > 0
            ? [
                  {
                      type: 'buffer',
                      severity: 'good' as const,
                      title: t('dutchPay.check.buffer', { amount: won(preview.buffer) }),
                      detail: t('dutchPay.check.bufferDetail', {
                          received: formatAmount(preview.receivedTotal, { showUnit: false }),
                          returned: formatAmount(preview.returned, { showUnit: false }),
                      }),
                  },
              ]
            : []),
        ...(preview.outstanding > 0
            ? [
                  {
                      type: 'outstanding',
                      severity: 'warn' as const,
                      title: t('dutchPay.check.outstanding', {
                          amount: won(preview.outstanding),
                      }),
                      detail: t('dutchPay.check.outstandingDetail'),
                  },
              ]
            : []),
    ];
    const summary = [
        t('dutchPay.check.summary', {
            paid: won(preview.paidTotal),
            share: won(preview.myShare),
            returned: won(preview.returned),
            block: blockName,
        }),
        preview.buffer > 0 && t('dutchPay.check.summaryBuffer', { buffer: won(preview.buffer) }),
    ]
        .filter(Boolean)
        .join(' ');

    const isEdited = editedShare !== null;
    const shareHint =
        received.length === 0
            ? t('dutchPay.myShare.hintEmpty')
            : isEdited
              ? t('dutchPay.myShare.hintEdited', { amount: won(preview.autoMyShare) })
              : t('dutchPay.myShare.hint');

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            title={t(isEdit ? 'dutchPay.titleEdit' : 'dutchPay.title')}
            hasCloseButton
            isDismissible={!isBusy}
            scrollable
        >
            {isLoading ? (
                <View className="items-center gap-3 py-16">
                    {query.isError ? (
                        <>
                            <AppText className="text-13 text-ink-sub">
                                {t('dutchPay.error.load')}
                            </AppText>
                            <Button
                                title={t('action.retry', { ns: 'common' })}
                                variant="secondary"
                                size="sm"
                                onPress={() => query.refetch()}
                            />
                        </>
                    ) : (
                        <ActivityIndicator color={colors.primary[700]} />
                    )}
                </View>
            ) : (
                <View className="gap-3">
                    <TransactionGroup
                        label={t('dutchPay.payments.label')}
                        total={won(preview.paidTotal)}
                        items={payments}
                        addLabel={t('dutchPay.payments.add')}
                        onAdd={() => setPicking('OUT')}
                    />
                    <TransactionGroup
                        label={t('dutchPay.received.label')}
                        total={won(preview.receivedTotal)}
                        items={received}
                        emptyLabel={t('dutchPay.received.empty')}
                        addLabel={t('dutchPay.received.add')}
                        onAdd={() => setPicking('IN')}
                    />

                    {received.length > 0 && preview.receivedTotal > preview.paidTotal && (
                        <View className="flex-row gap-2 rounded-12 bg-caution-soft-bg px-3 py-2.5">
                            <View className="h-[18px] w-[18px] items-center justify-center rounded-[5px] bg-caution">
                                <AppText className="font-bold text-12 text-caution-text">!</AppText>
                            </View>
                            <AppText className="flex-1 text-12 leading-[17px] text-caution-soft-text">
                                {t('dutchPay.overNotice')}
                            </AppText>
                        </View>
                    )}

                    <View className="gap-1">
                        <View className="flex-row items-center gap-1">
                            <AppText className="text-13 text-ink-sub">
                                {t('dutchPay.myShare.label')}
                            </AppText>
                            <AppText className="flex-1 text-13 text-ink-sub">
                                {t('dutchPay.myShare.caption')}
                            </AppText>
                            {isEdited && (
                                <View className="rounded-8 bg-surface-app px-2 py-0.5">
                                    <AppText className="font-semibold text-12 text-primary-800">
                                        {t('dutchPay.myShare.edited')}
                                    </AppText>
                                </View>
                            )}
                        </View>
                        <View
                            className={cn(
                                'h-12 flex-row items-center gap-2 border-primary-700',
                                isEdited ? 'border-b-2' : 'border-b',
                            )}
                        >
                            <BottomSheetTextInput
                                ref={shareInputRef}
                                accessibilityLabel={t('dutchPay.myShare.label')}
                                value={formatAmount(preview.myShare, { showUnit: false })}
                                onChangeText={handleChangeShare}
                                keyboardType="number-pad"
                                selectTextOnFocus
                                style={{
                                    flex: 1,
                                    minWidth: 0,
                                    padding: 0,
                                    fontFamily: fontFamily.bold,
                                    fontSize: 30,
                                    color: colors.ink.DEFAULT,
                                    includeFontPadding: false,
                                }}
                            />
                            <AppText className="font-bold text-17">{t('dutchPay.unit')}</AppText>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={t('dutchPay.myShare.edit')}
                                hitSlop={6}
                                onPress={() => shareInputRef.current?.focus()}
                                className="h-8 w-8 items-center justify-center rounded-8 bg-surface-neutral active:bg-surface-chip"
                            >
                                <Icon name="pencil" size={16} color={colors.primary[700]} />
                            </Pressable>
                        </View>
                        <AppText className="text-12 text-ink-sub">{shareHint}</AppText>
                    </View>

                    {received.length > 0 && (
                        <ImpactList
                            title={t('dutchPay.check.title')}
                            subtitle={summary}
                            items={checkItems}
                        />
                    )}
                </View>
            )}

            {errorMessage && (
                <AppText className="mt-3 text-center text-12 text-danger-text">
                    {errorMessage}
                </AppText>
            )}
            <View className="mt-6 gap-2">
                {isEdit && !isLoading && (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ disabled: isBusy }}
                        disabled={isBusy}
                        onPress={handleRelease}
                        className={cn(
                            'h-13.5 items-center justify-center rounded-14 border-2 border-danger-text bg-white active:bg-danger-bg',
                            isBusy && 'opacity-50',
                        )}
                    >
                        <AppText className="font-bold text-16 text-danger-text">
                            {t('dutchPay.release')}
                        </AppText>
                    </Pressable>
                )}
                <Button
                    title={submitTitle}
                    loadingTitle={t('dutchPay.saving')}
                    isLoading={save.isPending}
                    disabled={!canSubmit || release.isPending}
                    onPress={handleSubmit}
                />
            </View>
        </BottomSheet>
    );
}

interface TransactionGroupProps {
    label: string;
    /** 합계 (예: 100,000원) */
    total: string;
    items: TransactionItem[];
    /** 비어 있을 때 문구 (받은 돈) */
    emptyLabel?: string;
    addLabel: string;
    onAdd: () => void;
}

/** 내가 결제한 돈 · 정산으로 받은 돈: 라벨과 합계 + 거래 카드 + '더 고르기' */
function TransactionGroup({
    label,
    total,
    items,
    emptyLabel,
    addLabel,
    onAdd,
}: TransactionGroupProps) {
    return (
        <View className="gap-2">
            <View className="flex-row items-center justify-between">
                <AppText className="text-13 text-ink-sub">{label}</AppText>
                <AppText className="font-semibold text-13">{total}</AppText>
            </View>
            <View className="overflow-hidden rounded-16 border border-line bg-white">
                {items.map((item) => (
                    <DutchPayTransactionRow
                        key={item.transactionId}
                        transaction={item}
                        isLast={false}
                    />
                ))}
                {items.length === 0 && emptyLabel && (
                    <AppText className="border-b border-line-soft px-4 py-4 text-13 text-ink-sub">
                        {emptyLabel}
                    </AppText>
                )}
                <Pressable
                    accessibilityRole="button"
                    onPress={onAdd}
                    className="h-[42px] items-center justify-center active:bg-surface-neutral"
                >
                    <AppText className="font-semibold text-13 text-primary-700">{addLabel}</AppText>
                </Pressable>
            </View>
        </View>
    );
}
