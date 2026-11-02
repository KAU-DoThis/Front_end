import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import { formatAmount, formatWon } from '@/lib/format';
import { AppText } from '@/shared/components/ui/AppText';
import { BottomSheet, BottomSheetTextInput } from '@/shared/components/ui/BottomSheet';
import { Button } from '@/shared/components/ui/Button';
import { Icon } from '@/shared/components/ui/Icon';
import { ImpactList } from '@/shared/components/ui/ImpactList';
import { Toggle } from '@/shared/components/ui/Toggle';
import { ApiError } from '@/shared/types/api';
import { colors, fontFamily } from '@/styles/tokens';

import { useBlockHomeQuery } from '@/features/block/api/useBlockHomeQuery';
import { useSimulateTransferQuery } from '@/features/block/api/useSimulateTransferQuery';
import { useTransferBlockMutation } from '@/features/block/api/useTransferBlockMutation';
import type { HomeBlock } from '@/features/block/types/block';
import { TRANSFER_ERROR_CODE, type TransferResponse } from '@/features/block/types/blockTransfer';

import { MiniBeaker } from './MiniBeaker';
import { TransferBlockCard } from './TransferBlockCard';

/** 금액 입력 최대 자릿수 (999억 원) */
const MAX_AMOUNT_DIGITS = 11;
const QUICK_AMOUNTS = [
    { label: '+1만', amount: 10_000 },
    { label: '+5만', amount: 50_000 },
] as const;

type PickingSide = 'from' | 'to';

interface TransferSheetProps {
    isOpen: boolean;
    onClose: () => void;
    /** 처음 고른 보내는 블록 (블록 상세 '다른 블록에서 채우기'는 비워 둔다) */
    initialFromBlockId?: number | null;
    /** 처음 고른 받는 블록 */
    initialToBlockId?: number | null;
    onTransferred?: (result: TransferResponse) => void;
}

/**
 * 03-2 자금 이동 시트 (드래그로 놓았을 때 · 버튼으로 열었을 때 공통)
 * 금액을 바꿀 때마다 300ms 뒤 이동 전 검증을 다시 계산하고, 확인 후 옮긴다.
 * 실제 계좌 이체 없이 앱 안의 블록 배분만 바뀐다.
 */
export function TransferSheet({
    isOpen,
    onClose,
    initialFromBlockId = null,
    initialToBlockId = null,
    onTransferred,
}: TransferSheetProps) {
    const [fromBlockId, setFromBlockId] = useState<number | null>(initialFromBlockId);
    const [toBlockId, setToBlockId] = useState<number | null>(initialToBlockId);
    const [amount, setAmount] = useState(0);
    // 처음 열 때 받는 블록이 모자란 만큼 금액을 채워 둔다. 사용자가 금액을 건드리면 다시 채우지 않는다.
    const [isAmountTouched, setIsAmountTouched] = useState(false);
    const [isAutoReturn, setIsAutoReturn] = useState(true);
    const [picking, setPicking] = useState<PickingSide | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // 시트를 열 때마다 처음 상태로 되돌린다. (effect 대신 렌더 중에 이전 값과 비교 — React 권장 방식)
    const [wasOpen, setWasOpen] = useState(isOpen);
    if (isOpen !== wasOpen) {
        setWasOpen(isOpen);
        if (isOpen) {
            setFromBlockId(initialFromBlockId);
            setToBlockId(initialToBlockId);
            setAmount(0);
            setIsAmountTouched(false);
            setIsAutoReturn(true);
            setPicking(null);
            setErrorMessage(null);
        }
    }

    const { data: home } = useBlockHomeQuery();
    const blocks = home?.blocks ?? [];
    const fromBlock = blocks.find((block) => block.blockId === fromBlockId) ?? null;
    const toBlock = blocks.find((block) => block.blockId === toBlockId) ?? null;

    const simulation = useSimulateTransferQuery({ fromBlockId, toBlockId, amount });
    const result = simulation.data;
    const shortfall = result?.shortfall?.amount ?? 0;

    if (isOpen && !isAmountTouched && shortfall > 0 && amount !== shortfall) {
        setAmount(shortfall);
    }

    const transfer = useTransferBlockMutation();

    const changeAmount = (next: number) => {
        setIsAmountTouched(true);
        setErrorMessage(null);
        setAmount(Math.max(0, next));
    };

    const handleChangeText = (text: string) => {
        const digits = text.replace(/\D/g, '').slice(0, MAX_AMOUNT_DIGITS);
        changeAmount(digits ? Number(digits) : 0);
    };

    const balanceAfter = (blockId: number | null) =>
        result?.blocks.find((block) => block.blockId === blockId)?.balanceAfter ?? null;
    const versionOf = (blockId: number | null) =>
        result?.blocks.find((block) => block.blockId === blockId)?.version ?? 0;

    const income = home?.nextExpectedIncome ?? null;
    const canSubmit =
        fromBlockId !== null &&
        toBlockId !== null &&
        amount > 0 &&
        result !== undefined &&
        !simulation.isStale &&
        !result.blocked;

    const submit = (confirmed: boolean) => {
        if (fromBlockId === null || toBlockId === null) {
            return;
        }
        setErrorMessage(null);
        transfer.mutate(
            {
                fromBlockId,
                toBlockId,
                amount,
                reason: 'MANUAL',
                fromVersion: versionOf(fromBlockId),
                toVersion: versionOf(toBlockId),
                confirmed,
                autoReturn: {
                    enabled: isAutoReturn && income !== null,
                    on: 'NEXT_REGULAR_INCOME',
                },
            },
            {
                onSuccess: (response) => {
                    onTransferred?.(response);
                    onClose();
                },
                onError: (error) => {
                    if (
                        error instanceof ApiError &&
                        error.code === TRANSFER_ERROR_CODE.VERSION_CONFLICT
                    ) {
                        simulation.refetch();
                        setErrorMessage(
                            '그사이 잔액이 바뀌어서 다시 계산했어요. 확인 후 옮겨 주세요',
                        );
                        return;
                    }
                    setErrorMessage(
                        error instanceof ApiError
                            ? error.message
                            : '옮기지 못했어요. 잠시 후 다시 시도해 주세요',
                    );
                },
            },
        );
    };

    const handleSubmit = () => {
        if (!canSubmit) {
            return;
        }
        if (result.requiresConfirm) {
            const dangers = result.items
                .filter((item) => item.severity === 'danger')
                .map((item) => item.title)
                .join('\n');
            Alert.alert('규칙이 깨지는 이동이에요', dangers, [
                { text: '취소', style: 'cancel' },
                { text: '그래도 옮기기', style: 'destructive', onPress: () => submit(true) },
            ]);
            return;
        }
        submit(false);
    };

    const handlePick = (block: HomeBlock) => {
        if (picking === 'from') {
            setFromBlockId(block.blockId);
        } else {
            setToBlockId(block.blockId);
        }
        setPicking(null);
        setErrorMessage(null);
    };

    if (picking) {
        const excludeId = picking === 'from' ? toBlockId : fromBlockId;
        const selectedId = picking === 'from' ? fromBlockId : toBlockId;
        return (
            <BottomSheet
                isOpen={isOpen}
                onClose={onClose}
                title={picking === 'from' ? '보내는 블록 고르기' : '받는 블록 고르기'}
            >
                <View className="gap-2 pb-2">
                    {blocks
                        .filter((block) => block.blockId !== excludeId)
                        .map((block) => (
                            <BlockPickRow
                                key={block.blockId}
                                block={block}
                                isSelected={block.blockId === selectedId}
                                onPress={() => handlePick(block)}
                            />
                        ))}
                    <Button
                        title="돌아가기"
                        variant="secondary"
                        size="md"
                        className="mt-2"
                        onPress={() => setPicking(null)}
                    />
                </View>
            </BottomSheet>
        );
    }

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="자금 이동">
            <View className="gap-2">
                <TransferBlockCard
                    label="보내는 블록"
                    block={fromBlock}
                    balanceAfter={balanceAfter(fromBlockId)}
                    onPress={() => setPicking('from')}
                />
                <TransferBlockCard
                    label="받는 블록"
                    block={toBlock}
                    balanceAfter={balanceAfter(toBlockId)}
                    onPress={() => setPicking('to')}
                />
            </View>

            <AppText className="mt-4 text-13 text-ink-sub">옮길 금액</AppText>
            <View className="h-12 flex-row items-center border-b-2 border-primary-600">
                <BottomSheetTextInput
                    accessibilityLabel="옮길 금액"
                    value={amount > 0 ? formatAmount(amount, { showUnit: false }) : ''}
                    onChangeText={handleChangeText}
                    placeholder="0"
                    placeholderTextColor={colors.ink.disabled}
                    keyboardType="number-pad"
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
                <AppText className="font-semibold text-20">원</AppText>
            </View>

            <View className="mt-3 flex-row gap-2">
                {QUICK_AMOUNTS.map((quick) => (
                    <QuickChip
                        key={quick.label}
                        label={quick.label}
                        onPress={() => changeAmount(amount + quick.amount)}
                    />
                ))}
                <QuickChip
                    label="부족한 만큼"
                    isStrong
                    disabled={shortfall <= 0}
                    onPress={() => changeAmount(shortfall)}
                />
            </View>

            {result?.blocked && result.blockedReason && (
                <AppText className="mt-2 text-12 text-danger-text">{result.blockedReason}</AppText>
            )}

            {result && !result.blocked && result.items.length > 0 && (
                <ImpactList
                    className={cn('mt-4', simulation.isStale && 'opacity-60')}
                    title="이동 전 검증"
                    subtitle="옮긴 뒤 각 블록의 규칙을 미리 계산했어요"
                    items={result.items}
                />
            )}

            {fromBlock && income && (
                <View className="mt-3 flex-row items-center gap-3 rounded-16 border border-primary-100 bg-surface-neutral px-4 py-3">
                    <AppText className="flex-1 text-13 leading-[19.5px]">
                        {`다음 ${income.label}날(${Number(income.expectedDate.slice(8, 10))}일)에 ${fromBlock.name} 블록으로 `}
                        <AppText className="font-bold text-13 leading-[19.5px]">
                            {`${formatWon(amount)} 자동 되돌리기`}
                        </AppText>
                    </AppText>
                    <Toggle
                        value={isAutoReturn}
                        onValueChange={setIsAutoReturn}
                        accessibilityLabel="다음 정기 입금 때 자동 되돌리기"
                    />
                </View>
            )}

            <Button
                className="mt-6"
                title={amount > 0 ? `${formatWon(amount)} 옮기기` : '옮기기'}
                isLoading={transfer.isPending}
                loadingTitle="옮기는 중"
                disabled={!canSubmit}
                onPress={handleSubmit}
            />
            {errorMessage && (
                <AppText className="mt-2 text-center text-12 text-danger-text">
                    {errorMessage}
                </AppText>
            )}
            <AppText className="mt-2 text-center text-12 text-ink-sub">
                실제 계좌 이체 없이 앱 안에서만 배분이 바뀌어요
            </AppText>
        </BottomSheet>
    );
}

interface QuickChipProps {
    label: string;
    /** 부족한 만큼: 진한 테두리 + 청록 글씨 */
    isStrong?: boolean;
    disabled?: boolean;
    onPress: () => void;
}

function QuickChip({ label, isStrong = false, disabled = false, onPress }: QuickChipProps) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            disabled={disabled}
            // 32px 칩의 터치 영역을 44px로 맞춘다.
            hitSlop={6}
            onPress={onPress}
            className={cn(
                'h-8 justify-center rounded-8 border bg-white px-3 active:bg-surface-neutral',
                isStrong ? 'border-line-control' : 'border-primary-100',
                disabled && 'opacity-40',
            )}
        >
            <AppText className={cn('text-13', isStrong && 'font-semibold text-primary-700')}>
                {label}
            </AppText>
        </Pressable>
    );
}

interface BlockPickRowProps {
    block: HomeBlock;
    isSelected: boolean;
    onPress: () => void;
}

function BlockPickRow({ block, isSelected, onPress }: BlockPickRowProps) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${block.name} 블록, ${formatWon(block.balance)}`}
            accessibilityState={{ selected: isSelected }}
            onPress={onPress}
            className={cn(
                'h-[70px] flex-row items-center gap-3 rounded-12 border bg-white px-3 active:bg-surface-neutral',
                isSelected ? 'border-primary-600' : 'border-line',
            )}
        >
            <MiniBeaker color={block.color} status={block.status} fillRate={block.fillRate} />
            <AppText className="flex-1 font-bold text-15">{block.name}</AppText>
            <AppText className="font-bold text-15">
                {formatAmount(block.balance, { showUnit: false })}
            </AppText>
            {isSelected && <Icon name="check" size={16} color={colors.primary[600]} />}
        </Pressable>
    );
}
