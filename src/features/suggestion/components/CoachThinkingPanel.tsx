import { ActivityIndicator, Pressable, View } from 'react-native';

import { AppText } from '@/shared/components/ui/AppText';
import { colors } from '@/styles/tokens';

import { CoachUserMessage } from './CoachUserMessage';

interface CoachThinkingPanelProps {
    text: string;
    onCancel: () => void;
}

/** 2-0 생각하는 중: 보낸 말 · 로딩 · 그만두기 */
export function CoachThinkingPanel({ text, onCancel }: CoachThinkingPanelProps) {
    return (
        <View className="gap-4">
            <CoachUserMessage text={text} />
            <View className="flex-row items-center gap-3 rounded-16 bg-surface-neutral p-4">
                <ActivityIndicator color={colors.primary[700]} />
                <AppText className="font-semibold text-15">초불이가 생각하고 있어요</AppText>
            </View>
            <Pressable
                accessibilityRole="button"
                onPress={onCancel}
                hitSlop={8}
                className="items-center py-2 active:opacity-60"
            >
                <AppText className="font-semibold text-15 text-ink-sub">그만두기</AppText>
            </Pressable>
        </View>
    );
}
