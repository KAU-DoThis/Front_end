import { View } from 'react-native';

import { Screen } from '@/shared/components/layout/Screen';
import { AppText } from '@/shared/components/ui/AppText';

/** 절약 · 확정 절약분, 목표별 진행, 절약 후보 (화면 작업 전 자리 표시) */
export function SavingScreen() {
    return (
        <Screen edges={['top']}>
            <View className="flex-1 items-center justify-center">
                <AppText className="font-bold text-20">절약</AppText>
            </View>
        </Screen>
    );
}
