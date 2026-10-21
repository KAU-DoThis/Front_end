import { View } from 'react-native';

import { Screen } from '@/shared/components/layout/Screen';
import { AppText } from '@/shared/components/ui/AppText';

/** 내역 · 거래 목록 (화면 작업 전 자리 표시) */
export function TransactionListScreen() {
    return (
        <Screen edges={['top']}>
            <View className="flex-1 items-center justify-center">
                <AppText className="font-bold text-20">내역</AppText>
            </View>
        </Screen>
    );
}
