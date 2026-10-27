import { router } from 'expo-router';
import { View } from 'react-native';

import { Screen } from '@/shared/components/layout/Screen';
import { AppText } from '@/shared/components/ui/AppText';
import { Button } from '@/shared/components/ui/Button';

/** 홈 · 블록 (홈 화면 작업 전 자리 표시) */
export function BlockHomeScreen() {
    return (
        <Screen edges={['top']}>
            <View className="flex-1 items-center justify-center gap-4 px-5">
                <AppText className="font-bold text-20">블록</AppText>
                <AppText className="text-ink-sub">홈 화면은 다음 작업에서 만들어요</AppText>
                {__DEV__ && (
                    <Button
                        title="공통 컴포넌트 보기"
                        variant="secondary"
                        size="sm"
                        onPress={() => router.push('/dev/components')}
                    />
                )}
            </View>
        </Screen>
    );
}
