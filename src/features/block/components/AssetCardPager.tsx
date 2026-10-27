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

import type { BlockHome } from '@/features/block/types/blockHome';

interface AssetCardPagerProps {
    home: BlockHome;
}

/**
 * 총 자산 카드 (01 홈) — 옆으로 넘기면 계좌별 카드 (01-1)
 * 넘김 점: 전체 / 계좌 수만큼
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
                    baseDate={home.baseDate}
                    total={home.totalAssets}
                    subLabel="오늘 쓸 수 있는 돈"
                    subAmount={home.todayAvailable}
                    aside={
                        <AppText className="text-right text-12 leading-[18px] text-primary-100">
                            {`${home.todayBasis.blockName} ${formatAmount(home.todayBasis.balance)}\n남은 ${home.todayBasis.remainingDays}일 기준`}
                        </AppText>
                    }
                />
                {home.accounts.map((account) => (
                    <CardPage
                        key={account.accountId}
                        width={pageWidth}
                        label={`${account.bankName} ${account.accountType} ••${account.accountNumberTail}`}
                        baseDate={home.baseDate}
                        total={account.balance}
                        subLabel="이번 달 나간 돈"
                        subAmount={account.monthlySpent}
                        aside={
                            // 계좌별 내역(09-2)이 생기면 계좌 필터를 넘긴다.
                            <Pressable
                                accessibilityRole="link"
                                hitSlop={12}
                                onPress={() => router.push('/transactions')}
                                className="active:opacity-60"
                            >
                                <AppText className="text-12 leading-[18px] text-primary-300">
                                    거래 내역 보기 ›
                                </AppText>
                            </Pressable>
                        }
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

interface CardPageProps {
    width: number;
    label: string;
    baseDate: string;
    total: number;
    subLabel: string;
    subAmount: number;
    /** 아래 줄 오른쪽 (근거 문구 또는 링크) */
    aside: ReactNode;
}

function CardPage({ width, label, baseDate, total, subLabel, subAmount, aside }: CardPageProps) {
    return (
        <View className="px-5 pt-5" style={{ width }}>
            <View className="flex-row items-center justify-between">
                <AppText className="text-13 text-primary-100">{label}</AppText>
                <AppText className="text-12 text-primary-100">
                    {formatMonthDay(baseDate)} 기준
                </AppText>
            </View>
            <AmountText amount={total} isOnDark className="mt-2 text-30 tracking-[-0.5px]" />
            <View className="mb-4 mt-4 h-px bg-primary-100/25" />
            <View className="flex-row items-end justify-between">
                <View className="gap-0.5">
                    <AppText className="text-13 text-primary-100">{subLabel}</AppText>
                    <AmountText amount={subAmount} className="text-24 text-primary-300" />
                </View>
                {aside}
            </View>
        </View>
    );
}
