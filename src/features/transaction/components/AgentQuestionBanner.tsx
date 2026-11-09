import { Pressable, View } from 'react-native';

import { AppText } from '@/shared/components/ui/AppText';
import { Icon } from '@/shared/components/ui/Icon';
import { Mascot } from '@/shared/components/ui/Mascot';
import { colors } from '@/styles/tokens';

import { RichTextView } from '@/features/transaction/components/RichTextView';
import type { RichText } from '@/features/transaction/types/transaction';

interface AgentQuestionBannerProps {
    message: RichText;
    onPress: () => void;
}

/** 에이전트가 거래 맥락을 묻는 말풍선 배너 (시안 09). 누르면 답변 시트(09-1)가 열린다. */
export function AgentQuestionBanner({ message, onPress }: AgentQuestionBannerProps) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityHint="질문에 답하는 시트를 열어요"
            onPress={onPress}
            className="flex-row items-center gap-3 rounded-24 rounded-tl-[4px] border border-primary-100 bg-primary-50 px-4 py-3 active:opacity-80"
        >
            <Mascot className="h-8 w-8 rounded-16 bg-white" />
            <View className="flex-1">
                <RichTextView parts={message} className="text-13 leading-[19px]" />
                <AppText className="text-13 leading-[19px] text-ink-sub">
                    답해주면 소비 분석이 정확해져요
                </AppText>
            </View>
            <Icon name="chevron-right" size={16} color={colors.primary[700]} strokeWidth={1.33} />
        </Pressable>
    );
}
