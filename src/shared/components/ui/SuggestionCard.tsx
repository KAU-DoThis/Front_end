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
    /** 말풍선 첫 줄 (예: 제안, 왜 주의인가요?) */
    title: string;
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

    const bubble = (
        <View
            className={cn(
                'rounded-24 rounded-tl-[4px] border border-primary-100 bg-primary-50 p-4',
                isChat ? 'flex-1' : 'pb-5',
            )}
        >
            {isChat ? (
                <AppText className="font-bold text-12 text-primary-700">{title}</AppText>
            ) : (
                <View className="flex-row items-center gap-2">
                    <Mascot
                        showLabel={false}
                        className="h-7 w-7 rounded-12 border border-primary-600 bg-white"
                    />
                    <AppText className="font-bold text-13 text-primary-700">{title}</AppText>
                </View>
            )}
            <AppText className={cn('text-15 leading-[23px]', isChat ? 'mt-1' : 'mt-2')}>
                {message}
            </AppText>
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
            <Mascot showLabel={false} className="h-8 w-8 rounded-16" />
            {bubble}
        </View>
    );
}
