import { View } from 'react-native';

import { cn } from '@/lib/cn';
import { AppText } from '@/shared/components/ui/AppText';

interface MascotProps {
    /** 크기는 className으로 정한다. (탭 바 h-14.5 w-14.5 · 에이전트 배너 h-12 w-12) */
    className?: string;
}

/** 마스코트 '초불이' 자리 표시. 캐릭터가 나오면 이 컴포넌트만 바꾼다. (시안 Mascot 2:12) */
export function Mascot({ className }: MascotProps) {
    return (
        <View
            className={cn(
                'items-center justify-center rounded-24 border-1.5 border-dashed border-primary-600 bg-primary-50',
                className,
            )}
        >
            <AppText className="font-bold text-10 text-primary-700">캐릭터</AppText>
        </View>
    );
}
