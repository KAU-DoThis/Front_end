import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Screen } from '@/shared/components/layout/Screen';
import { AppText } from '@/shared/components/ui/AppText';
import { Button } from '@/shared/components/ui/Button';

/** 02 블록 상세 (다음 작업에서 사용형 · 목표형 · 고정지출형 화면으로 채운다) */
export function BlockDetailScreen() {
    const { blockId } = useLocalSearchParams<{ blockId: string }>();

    return (
        <Screen>
            <View className="flex-1 items-center justify-center gap-4 px-5">
                <AppText className="font-bold text-20">블록 상세 #{blockId}</AppText>
                <AppText className="text-ink-sub">블록 상세는 다음 작업에서 만들어요</AppText>
                <Button title="돌아가기" variant="secondary" size="sm" onPress={router.back} />
            </View>
        </Screen>
    );
}
