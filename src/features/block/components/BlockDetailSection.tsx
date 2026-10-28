import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/shared/components/ui/AppText';

interface InfoLineProps {
    title: string;
    /** 오른쪽 보조 문구 (예: 월 1,500,000원  매월 1일 시작) */
    value?: string;
}

/** 제목 + 오른쪽 보조 문구 한 줄 (시안 02 규칙 · 최근 거래 · 납부 기록) */
export function InfoLine({ title, value }: InfoLineProps) {
    return (
        <View className="flex-row items-center justify-between gap-3">
            <AppText className="font-bold text-15">{title}</AppText>
            {value && (
                <AppText numberOfLines={1} className="shrink text-13 text-ink-sub">
                    {value}
                </AppText>
            )}
        </View>
    );
}

interface BlockDetailListProps {
    title: string;
    titleValue?: string;
    /** 목록 아래 링크 (예: 생활비 거래 전체 보기) */
    moreLabel: string;
    moreHref: Href;
    children: ReactNode;
}

/** 제목 + 화면 끝까지 닿는 목록 + 전체 보기 링크 */
export function BlockDetailList({
    title,
    titleValue,
    moreLabel,
    moreHref,
    children,
}: BlockDetailListProps) {
    return (
        <View className="mt-4">
            <InfoLine title={title} value={titleValue} />
            {/* 목록은 화면 좌우 4px까지 넓힌다. (시안 382 폭) */}
            <View className="-mx-4 mt-2 border-t border-line-soft">{children}</View>
            <Pressable
                accessibilityRole="link"
                hitSlop={10}
                onPress={() => router.push(moreHref)}
                className="mt-5 self-center active:opacity-60"
            >
                <AppText className="font-semibold text-15 text-primary-700">{moreLabel}</AppText>
            </Pressable>
        </View>
    );
}
