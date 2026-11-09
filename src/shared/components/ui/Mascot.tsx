import { Image, View, type ImageSourcePropType } from 'react-native';

import { cn } from '@/lib/cn';

/**
 * 초불이 포즈 (캐릭터 시트 그대로)
 * - 전신: 60px보다 큰 자리 (초불이의 방)
 * - head-*: 60px 이하 자리 (탭 버튼 · 배너 · 아바타)
 */
const POSES = {
    basic: require('@/assets/images/agent/chobul-basic.png'), // 기본 · 동전
    look: require('@/assets/images/agent/chobul-look.png'), // 돋보기 (생각 중 · 되묻기)
    idea: require('@/assets/images/agent/chobul-idea.png'), // 돋보기 + 전구 (확인 · 금액)
    yay: require('@/assets/images/agent/chobul-yay.png'), // 신남 (완료)
    goal: require('@/assets/images/agent/chobul-goal.png'), // 목표 달성 (답변)
    wink: require('@/assets/images/agent/chobul-wink.png'), // 윙크 (홈 이동)
    caution: require('@/assets/images/agent/chobul-caution.png'), // 조금 주의 (노랑)
    'head-basic': require('@/assets/images/agent/chobul-head-basic.png'),
    'head-happy': require('@/assets/images/agent/chobul-head-happy.png'),
    'head-wink': require('@/assets/images/agent/chobul-head-wink.png'),
} satisfies Record<string, ImageSourcePropType>;

export type MascotPose = keyof typeof POSES;

interface MascotProps {
    pose?: MascotPose;
    /** 크기·바탕·테두리는 className으로 정한다. 이미지는 비율을 지키며 그 안에 맞춘다. */
    className?: string;
}

/** 마스코트 '초불이' */
export function Mascot({ pose = 'head-basic', className }: MascotProps) {
    return (
        <View className={cn('h-12 w-12 overflow-hidden', className)}>
            <Image
                source={POSES[pose]}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
                style={{ width: '100%', height: '100%' }}
            />
        </View>
    );
}
