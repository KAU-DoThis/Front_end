import type { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@/lib/cn';
import { AppText } from '@/shared/components/ui/AppText';
import { Button } from '@/shared/components/ui/Button';
import { Mascot } from '@/shared/components/ui/Mascot';

export interface SuggestionAction {
    title: string;
    variant: 'primary' | 'secondary';
    onPress?: () => void;
}

interface SuggestionCardProps {
    /**
     * 말풍선 첫 줄 (예: 제안, 왜 주의인가요?)
     * inline에서 생략하면 마스코트를 본문 왼쪽에 둔다. (시안 11 소비 분석 절약 제안)
     */
    title?: string;
    /** 본문. 금액 등을 굵게 하려면 AppText를 섞어 넘긴다. */
    message: ReactNode;
    /** 왼쪽부터 순서대로 그린다. (최대 2개) */
    actions?: SuggestionAction[];
    /**
     * inline: 화면 안 설명 카드 — 마스코트가 제목 옆, 버튼 44 (02 '왜 주의인가요?')
     * chat: 에이전트 제안 — 마스코트가 말풍선 밖 왼쪽, 버튼 40 (카드 공통 컴포넌트 · 제안 카드)
     */
    variant?: 'inline' | 'chat';
    className?: string;
}

/**
 * 제안 카드 (SuggestionCard) — 에이전트가 말할 때만 쓰는 청록 말풍선.
 * 계산 결과는 ImpactList(회색)로 보여준다.
 */
export function SuggestionCard({
    title,
    message,
    actions = [],
    variant = 'inline',
    className,
}: SuggestionCardProps) {
    const isChat = variant === 'chat';
    const mascot = <Mascot className="h-7 w-7" />;

    const bubble = (
        <View
            className={cn(
                'rounded-24 rounded-tl-[4px] border border-primary-100 bg-primary-50 p-4',
                isChat ? 'flex-1' : 'pb-5',
            )}
        >
            {isChat ? (
                title ? (
                    <AppText className="font-bold text-12 text-primary-700">{title}</AppText>
                ) : null
            ) : title ? (
                <View className="flex-row items-center gap-2">
                    {mascot}
                    <AppText className="font-bold text-13 text-primary-700">{title}</AppText>
                </View>
            ) : null}
            {!isChat && !title ? (
                <View className="flex-row items-start gap-3">
                    {mascot}
                    <AppText className="flex-1 text-15 leading-[23px]">{message}</AppText>
                </View>
            ) : (
                <AppText
                    className={cn('text-15 leading-[23px]', title && (isChat ? 'mt-1' : 'mt-2'))}
                >
                    {message}
                </AppText>
            )}
            {actions.length > 0 && (
                <View className={cn('flex-row gap-2', isChat ? 'mt-4' : 'mt-3')}>
                    {actions.map((action) => (
                        <Button
                            key={action.title}
                            title={action.title}
                            variant={action.variant}
                            size={isChat ? 'sm' : 'md'}
                            onPress={action.onPress}
                            className="flex-1 px-2"
                        />
                    ))}
                </View>
            )}
        </View>
    );

    if (!isChat) {
        return <View className={className}>{bubble}</View>;
    }

    return (
        <View className={cn('flex-row items-start gap-3', className)}>
            <Mascot className="h-8 w-8" />
            {bubble}
        </View>
    );
}
