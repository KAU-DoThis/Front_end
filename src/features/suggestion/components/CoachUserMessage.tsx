import { View } from 'react-native';

import { AppText } from '@/shared/components/ui/AppText';

/** 내가 초불이에게 보낸 말 (오른쪽 청록 말풍선) */
export function CoachUserMessage({ text }: { text: string }) {
    return (
        <View className="max-w-[85%] self-end rounded-16 rounded-br-[4px] bg-primary-700 px-4 py-2.5">
            <AppText className="text-15 leading-[21px] text-white">{text}</AppText>
        </View>
    );
}
