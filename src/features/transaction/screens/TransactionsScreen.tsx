import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Screen } from '@/shared/components/layout/Screen';
import { AppText } from '@/shared/components/ui/AppText';
import { Icon } from '@/shared/components/ui/Icon';
import { colors } from '@/styles/tokens';

import { QuickInputSheet } from '@/features/transaction/components/QuickInputSheet';
import { SpendingAnalysisContent } from '@/features/transaction/components/SpendingAnalysisContent';
import { TransactionListContent } from '@/features/transaction/components/TransactionListContent';
import { TransactionTabs } from '@/features/transaction/components/TransactionTabs';
import { useTransactionFilterStore } from '@/features/transaction/stores/transactionFilterStore';

/** 주소 값(문자열)을 숫자 id로 바꾼다. 없거나(빈 값 포함) 숫자가 아니면 null */
const toId = (value: string | undefined) => {
    const id = Number(value);
    return value && Number.isInteger(id) ? id : null;
};

/** 숫자 id를 주소 값으로 바꾼다. 필터를 풀면 빈 값으로 둔다. */
const toParam = (id: number | null) => (id === null ? '' : String(id));

interface TransactionsHeaderProps {
    onPressQuickInput: () => void;
}

/** 내역 탭 머리: 제목 + 검색 + 빠른 입력 */
function TransactionsHeader({ onPressQuickInput }: TransactionsHeaderProps) {
    return (
        <View className="flex-row items-center px-5 pt-[21px]">
            <AppText className="flex-1 font-bold text-24">내역</AppText>
            {/* TODO: 거래 검색 화면이 생기면 연결한다. */}
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="거래 검색"
                disabled
                hitSlop={11}
            >
                <Icon name="search" size={22} />
            </Pressable>
            <Pressable
                accessibilityRole="button"
                onPress={onPressQuickInput}
                className="ml-[15px] h-[34px] flex-row items-center gap-1 rounded-16 border border-primary-100 bg-surface-neutral px-3 active:bg-surface-chip"
            >
                <Icon name="plus" size={14} color={colors.primary[700]} strokeWidth={1.4} />
                <AppText className="font-semibold text-13 text-primary-700">빠른 입력</AppText>
            </Pressable>
        </View>
    );
}

/**
 * 09 내역 · 11 소비 분석 (하단 탭 '내역')
 * 주소 값으로 필터를 받는다. 홈 계좌 카드 → accountId(09-2), 블록 상세 → blockId
 */
export function TransactionsScreen() {
    const { accountId, blockId } = useLocalSearchParams<{ accountId?: string; blockId?: string }>();
    const [isQuickInputOpen, setIsQuickInputOpen] = useState(false);
    const tab = useTransactionFilterStore((state) => state.tab);
    const params = useTransactionFilterStore((state) => state.params);
    const setTab = useTransactionFilterStore((state) => state.setTab);
    const setMonth = useTransactionFilterStore((state) => state.setMonth);
    const setStatus = useTransactionFilterStore((state) => state.setStatus);
    const setBlockId = useTransactionFilterStore((state) => state.setBlockId);
    const setAccountId = useTransactionFilterStore((state) => state.setAccountId);
    const applyRouteFilter = useTransactionFilterStore((state) => state.applyRouteFilter);
    const resetFilter = useTransactionFilterStore((state) => state.reset);

    // 화면이 사라지면(로그아웃 등) 고른 조건을 비운다.
    useEffect(() => resetFilter, [resetFilter]);

    // 다른 화면에서 블록·계좌를 들고 들어오면 그 조건으로 거래 목록을 보여준다.
    // 화면 안에서 고른 조건도 주소 값에 맞춰 두므로, 지금 조건과 같으면 화면 안에서 바꾼 것이라 건너뛴다.
    // (예: 계좌를 '전체'로 풀었다가 홈에서 같은 계좌로 다시 들어와도 다시 걸린다)
    useEffect(() => {
        const route = { accountId: toId(accountId), blockId: toId(blockId) };
        const current = useTransactionFilterStore.getState().params;
        if (route.accountId === current.accountId && route.blockId === current.blockId) return;
        applyRouteFilter(route);
    }, [accountId, blockId, applyRouteFilter]);

    const handleChangeBlock = (id: number | null) => {
        setBlockId(id);
        router.setParams({ blockId: toParam(id) });
    };

    const handleChangeAccount = (id: number | null) => {
        setAccountId(id);
        router.setParams({ accountId: toParam(id) });
    };

    return (
        <Screen edges={['top']}>
            <TransactionsHeader onPressQuickInput={() => setIsQuickInputOpen(true)} />
            <View className="mt-[17px] px-5">
                <TransactionTabs value={tab} onChange={setTab} />
            </View>
            {tab === 'LIST' ? (
                <TransactionListContent
                    params={params}
                    onChangeMonth={setMonth}
                    onChangeStatus={setStatus}
                    onChangeBlock={handleChangeBlock}
                    onChangeAccount={handleChangeAccount}
                />
            ) : (
                <SpendingAnalysisContent month={params.month} onChangeMonth={setMonth} />
            )}
            <QuickInputSheet isOpen={isQuickInputOpen} onClose={() => setIsQuickInputOpen(false)} />
        </Screen>
    );
}
