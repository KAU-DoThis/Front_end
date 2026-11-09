import { View } from 'react-native';

import { withAlpha } from '@/lib/color';
import { AppText } from '@/shared/components/ui/AppText';
import { colors } from '@/styles/tokens';

import { PressableScale } from './PressableScale';

const LABEL_SHADOW = `0px 2px 6px 0px ${withAlpha(colors.primary[900], 0.18)}`;

interface RoomLabelProps {
    label: string;
    /** 빨간 점 (확인할 거래처럼 할 일이 있을 때) */
    hasDot?: boolean;
    accessibilityHint: string;
    onPress: () => void;
}

/** 방 안 물건 이름표 (흰 알약 h30). 터치 영역은 위아래로 늘려 44에 맞춘다. */
export function RoomLabel({ label, hasDot = false, accessibilityHint, onPress }: RoomLabelProps) {
    return (
        <PressableScale
            accessibilityLabel={label}
            accessibilityHint={accessibilityHint}
            hitSlop={{ top: 7, bottom: 7 }}
            onPress={onPress}
        >
            <View
                className="h-[30px] flex-row items-center gap-1.5 rounded-full bg-white px-3"
                style={{ boxShadow: LABEL_SHADOW }}
            >
                {hasDot && <View className="h-2 w-2 rounded-full bg-danger" />}
                <AppText className="font-semibold text-12">{label}</AppText>
            </View>
        </PressableScale>
    );
}
