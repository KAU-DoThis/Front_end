import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import { AppText } from '@/shared/components/ui/AppText';
import { Icon } from '@/shared/components/ui/Icon';
import { colors } from '@/styles/tokens';

interface AgentRoomHeaderProps {
    /** 제목 아래 한 줄 (불러오는 중에는 비운다) */
    subtitle?: string;
    /** 주의할 블록이 있으면 노란 글씨 */
    isAttention?: boolean;
    /** close: 방에서 나가기 (아래에서 올라온 화면) · back: 방 안 다른 상태에서 돌아오기 */
    leading: 'close' | 'back';
    onPressLeading: () => void;
    /** 있으면 오른쪽에 기록(시계) 버튼 (8. 초불이가 한 일) */
    onPressHistory?: () => void;
}

/** 초불이의 방 상단 바 (높이 64, 어두운 배경 위) */
export function AgentRoomHeader({
    subtitle,
    isAttention = false,
    leading,
    onPressLeading,
    onPressHistory,
}: AgentRoomHeaderProps) {
    return (
        <View className="h-16 flex-row items-center gap-1 px-2 pt-2.5">
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={leading === 'close' ? '초불이의 방 닫기' : '뒤로 가기'}
                onPress={onPressLeading}
                className="h-11 w-11 items-center justify-center rounded-full active:bg-primary-800"
            >
                <Icon
                    name={leading === 'close' ? 'close' : 'chevron-left'}
                    size={24}
                    color={colors.white}
                />
            </Pressable>
            <View className="flex-1 gap-0.5">
                <AppText className="font-bold text-17 text-white">초불이의 방</AppText>
                <AppText
                    className={cn('text-12', isAttention ? 'text-caution' : 'text-primary-100')}
                >
                    {subtitle}
                </AppText>
            </View>
            {onPressHistory && (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="초불이가 한 일 보기"
                    onPress={onPressHistory}
                    className="h-11 w-11 items-center justify-center rounded-full active:bg-primary-800"
                >
                    <Icon name="clock" size={24} color={colors.white} />
                </Pressable>
            )}
        </View>
    );
}
