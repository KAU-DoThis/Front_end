import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Screen } from '@/shared/components/layout/Screen';
import { AppText } from '@/shared/components/ui/AppText';

/** AI 에이전트 (전체 화면, 화면 작업 전 자리 표시) */
export function AgentScreen() {
    return (
        <Screen>
            <View className="flex-row items-center justify-end px-5 py-3">
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="에이전트 닫기"
                    hitSlop={12}
                    onPress={() => router.back()}
                >
                    <AppText className="font-semibold text-primary-700">닫기</AppText>
                </Pressable>
            </View>
            <View className="flex-1 items-center justify-center">
                <AppText className="font-bold text-20">에이전트</AppText>
            </View>
        </Screen>
    );
}
