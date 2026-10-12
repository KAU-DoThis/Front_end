import { Text, View } from 'react-native';

import { formatWon } from '@/lib/format';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { APP_NAME } from '@/shared/constants/config';

// 초기 세팅 확인용 화면 (NativeWind 스타일, 경로 alias, 공통 컴포넌트 동작 확인)
export default function HomeScreen() {
    return (
        <Screen className="bg-primary-50">
            <View className="flex-1 items-center justify-center gap-4 px-6">
                <Text className="text-3xl font-bold text-primary-900">{APP_NAME}</Text>
                <Text className="text-base text-primary-600">{formatWon(252000)}</Text>
                <Button title="시작하기" className="w-full" />
            </View>
        </Screen>
    );
}
