import { Pressable, View } from 'react-native';

import { AppText } from '@/shared/components/ui/AppText';
import { Icon } from '@/shared/components/ui/Icon';
import { Mascot } from '@/shared/components/ui/Mascot';
import { colors } from '@/styles/tokens';

import type { AgentMessage } from '@/features/block/types/blockHome';

interface AgentBannerProps {
    message: AgentMessage;
    onPress: () => void;
}

/** 에이전트 말풍선 배너 (왼쪽 위만 4로 각진 말풍선 모양) */
export function AgentBanner({ message, onPress }: AgentBannerProps) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityHint="에이전트 화면을 열어요"
            onPress={onPress}
            className="flex-row items-center gap-4 rounded-24 rounded-tl-[4px] border border-primary-100 bg-primary-50 py-4 pl-4 pr-[17px] active:opacity-80"
        >
            <Mascot className="h-12 w-12" />
            <View className="flex-1 gap-1">
                <AppText className="font-bold text-15 leading-[21px]">{message.title}</AppText>
                <AppText className="text-13 leading-[19px] text-ink-sub">{message.body}</AppText>
            </View>
            <Icon name="chevron-right" size={18} color={colors.ink.sub} />
        </Pressable>
    );
}
