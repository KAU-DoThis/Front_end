import { Alert, Pressable, View } from 'react-native';

import { AppText } from '@/shared/components/ui/AppText';
import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { colors } from '@/styles/tokens';

/**
 * 직접 바꿔보며 날짜 예측 (프리미엄 잠금, 시안 16)
 * 슬라이더는 잠긴 모양만 보여준다.
 */
export function GoalGuardPremiumCard() {
    return (
        <Card variant="neutral">
            <View className="flex-row items-center gap-2">
                <AppText className="font-bold text-15">직접 바꿔보며 날짜 예측</AppText>
                <View className="rounded-8 bg-primary-900 px-2 py-0.5">
                    <AppText className="font-bold text-11 text-white">프리미엄</AppText>
                </View>
            </View>
            <AppText className="mt-1 text-13 text-ink-sub">
                배분 금액과 기간을 움직이면 달성 날짜가 바로 바뀌어요
            </AppText>
            <View
                className="mt-4 h-5 justify-center"
                importantForAccessibility="no-hide-descendants"
            >
                <View className="h-1.5 rounded-full bg-line" />
                <View className="absolute left-1/2 -ml-2.5 h-5 w-5 rounded-full border-2 border-line-control bg-white" />
            </View>
            <Pressable
                accessibilityRole="button"
                hitSlop={12}
                // TODO: 프리미엄 플랜(18) 화면이 생기면 그쪽으로 보낸다.
                onPress={() => Alert.alert('프리미엄은 준비 중이에요')}
                className="mt-5 flex-row items-center gap-1.5 self-start active:opacity-60"
            >
                <Icon name="lock" size={16} color={colors.ink.DEFAULT} />
                <AppText className="font-semibold text-13">프리미엄으로 열기</AppText>
            </Pressable>
        </Card>
    );
}
