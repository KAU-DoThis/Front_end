import { View } from 'react-native';

import { Screen } from '@/shared/components/layout/Screen';
import { AppText } from '@/shared/components/ui/AppText';

/** 리포트 · 월간 리포트 (화면 작업 전 자리 표시) */
export function ReportScreen() {
    return (
        <Screen edges={['top']}>
            <View className="flex-1 items-center justify-center">
                <AppText className="font-bold text-20">리포트</AppText>
            </View>
        </Screen>
    );
}
