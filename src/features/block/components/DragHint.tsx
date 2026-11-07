import { View } from 'react-native';

import { AppText } from '@/shared/components/ui/AppText';

interface DragHintProps {
    /** 물방울 색 (보내는 블록 물 색) */
    color: string;
    /** 손가락 아래 블록 이름 (없으면 아직 블록 위가 아님) */
    targetName: string | null;
}

/**
 * 03-1 드래그 안내: "생활비 위에서 손을 떼세요"
 * 화면 위쪽에 떠 있어서, 아래로 스크롤해 둔 상태에서도 보이고 레이아웃을 밀지 않는다.
 */
export function DragHint({ color, targetName }: DragHintProps) {
    return (
        <View pointerEvents="none" className="absolute left-0 right-0 top-3 items-center">
            <View className="flex-row items-center gap-2.5 rounded-full bg-primary-900 py-2.5 pl-3 pr-4">
                <View className="h-5 w-5 rounded-full" style={{ backgroundColor: color }} />
                {targetName ? (
                    <AppText className="font-semibold text-15 text-white">
                        <AppText className="font-bold text-15 text-primary-300">
                            {targetName}
                        </AppText>
                        {' 위에서 손을 떼세요'}
                    </AppText>
                ) : (
                    <AppText className="font-semibold text-15 text-white">
                        옮길 블록 위로 끌어 주세요
                    </AppText>
                )}
            </View>
        </View>
    );
}
