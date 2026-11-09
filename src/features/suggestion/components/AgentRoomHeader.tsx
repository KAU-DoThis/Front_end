import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import { AppText } from '@/shared/components/ui/AppText';
import { Icon } from '@/shared/components/ui/Icon';
import { colors } from '@/styles/tokens';

interface AgentRoomHeaderProps {
    subtitle: string;
    /** 주의할 블록이 있으면 노란 글씨 */
    isAttention?: boolean;
    /** close: 방에서 나가기 (아래에서 올라온 화면) · back: 방 안 다른 상태에서 돌아오기 */
    leading: 'close' | 'back';
    onPressLeading: () => void;
}

/** 초불이의 방 상단 바 (높이 64, 어두운 배경 위). 오른쪽 기록 버튼은 기록 화면과 함께 붙인다. */
export function AgentRoomHeader({
    subtitle,
    isAttention = false,
    leading,
    onPressLeading,
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
        </View>
    );
}
