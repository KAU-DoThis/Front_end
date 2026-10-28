import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
    Pressable,
    ScrollView,
    View,
    type LayoutChangeEvent,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
} from 'react-native';

import { cn } from '@/lib/cn';
import { formatAmount, formatMonthDay } from '@/lib/format';
import { AmountText } from '@/shared/components/ui/AmountText';
import { AppText } from '@/shared/components/ui/AppText';

import type { BlockHome, LinkedAccountSummary } from '@/features/block/types/blockHome';

interface AssetCardPagerProps {
    home: BlockHome;
}

/**
 * 총 자산 카드 (01 홈) — 옆으로 넘기면 계좌·카드별 카드 (01-1)
 * 넘김 점: 전체 + 연동 계좌·카드 수
 */
export function AssetCardPager({ home }: AssetCardPagerProps) {
    const [pageWidth, setPageWidth] = useState(0);
    const [pageIndex, setPageIndex] = useState(0);
    const pageCount = home.accounts.length + 1;

    const handleLayout = (event: LayoutChangeEvent) => {
        setPageWidth(event.nativeEvent.layout.width);
    };

    // 넘기는 중에도 반 이상 넘어가면 점이 바로 바뀐다.
    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (pageWidth > 0) {
            setPageIndex(Math.round(event.nativeEvent.contentOffset.x / pageWidth));
        }
    };

    return (
        <View className="overflow-hidden rounded-24 bg-primary-900" onLayout={handleLayout}>
            <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={handleScroll}
            >
                <CardPage
                    width={pageWidth}
                    label={`연동 계좌 ${home.accounts.length}개의 총 자산`}
                    updatedAt={home.balanceUpdatedAt}
                    amount={home.totalAssets}
                    footer={
                        <>
                            <SubAmount label="오늘 쓸 수 있는 돈" amount={home.todayAvailable} />
                            <AppText className="text-right text-12 leading-[18px] text-primary-100">
                                {`${home.todayBasis.blockName} ${formatAmount(home.todayBasis.balance)}\n남은 ${home.todayBasis.remainingDays}일 기준`}
                            </AppText>
                        </>
                    }
                />
                {home.accounts.map((account) => (
                    <AccountPage
                        key={account.linkedAccountId}
                        account={account}
                        width={pageWidth}
                    />
                ))}
            </ScrollView>
            <View className="flex-row justify-center gap-[5px] pb-[13px] pt-5">
                {Array.from({ length: pageCount }, (_, index) => (
                    <View
                        key={index}
                        className={cn(
                            'h-[5px] rounded-full bg-white',
                            index === pageIndex ? 'w-4' : 'w-[5px] opacity-35',
                        )}
                    />
                ))}
            </View>
        </View>
    );
}

/** "KB국민 입출금통장 ••1234" — 비어 있는 값은 건너뛴다. */
function getAccountLabel({
    institutionName,
    accountName,
    accountNumberLast4,
}: LinkedAccountSummary) {
    return [institutionName, accountName, accountNumberLast4 && `••${accountNumberLast4}`]
        .filter(Boolean)
        .join(' ');
}

interface AccountPageProps {
    account: LinkedAccountSummary;
    width: number;
}

function AccountPage({ account, width }: AccountPageProps) {
    // 계좌별 내역(09-2)이 생기면 계좌 필터를 넘긴다.
    const transactionLink = (
        <Pressable
            accessibilityRole="link"
            hitSlop={12}
            onPress={() => router.push('/transactions')}
            className="ml-auto active:opacity-60"
        >
            <AppText className="text-12 leading-[18px] text-primary-300">거래 내역 보기 ›</AppText>
        </Pressable>
    );

    // 카드는 잔액이 없어 이번 달 사용액을 크게 보여준다. (시안에 카드 화면이 없어 임시 구성)
    if (account.type === 'CARD' || account.balance === null) {
        return (
            <CardPage
                width={width}
                label={`${getAccountLabel(account)} · 이번 달 사용`}
                updatedAt={account.balanceUpdatedAt}
                amount={account.monthlySpent}
                footer={transactionLink}
            />
        );
    }

    return (
        <CardPage
            width={width}
            label={getAccountLabel(account)}
            updatedAt={account.balanceUpdatedAt}
            amount={account.balance}
            footer={
                <>
                    <SubAmount label="이번 달 나간 돈" amount={account.monthlySpent} />
                    {transactionLink}
                </>
            }
        />
    );
}

interface CardPageProps {
    width: number;
    label: string;
    /** 기준 시각 (없으면 표시하지 않는다) */
    updatedAt: string | null;
    amount: number;
    /** 구분선 아래 줄 */
    footer: ReactNode;
}

function CardPage({ width, label, updatedAt, amount, footer }: CardPageProps) {
    return (
        <View className="px-5 pt-5" style={{ width }}>
            <View className="flex-row items-center gap-3">
                <AppText numberOfLines={1} className="flex-1 text-13 text-primary-100">
                    {label}
                </AppText>
                {updatedAt && (
                    <AppText className="text-12 text-primary-100">
                        {formatMonthDay(updatedAt)} 기준
                    </AppText>
                )}
            </View>
            <AmountText amount={amount} isOnDark className="mt-2 text-30 tracking-[-0.5px]" />
            <View className="mb-4 mt-4 h-px bg-primary-100/25" />
            <View className="min-h-[47px] flex-row items-end justify-between">{footer}</View>
        </View>
    );
}

function SubAmount({ label, amount }: { label: string; amount: number }) {
    return (
        <View className="gap-0.5">
            <AppText className="text-13 text-primary-100">{label}</AppText>
            <AmountText amount={amount} className="text-24 text-primary-300" />
        </View>
    );
}
