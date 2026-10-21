import { View } from 'react-native';

import { cn } from '@/lib/cn';
import { AppText } from '@/shared/components/ui/AppText';

/** 블록 상태 (백엔드 enum 값과 맞춘다) */
export type Status = 'SAFE' | 'CAUTION' | 'DANGER';

interface StatusTagProps {
    status: Status;
    className?: string;
}

const STATUS_STYLE = {
    SAFE: { label: '안전', container: 'bg-white', text: 'text-ink-safe' },
    CAUTION: { label: '주의', container: 'bg-caution', text: 'text-caution-text' },
    DANGER: { label: '위험', container: 'bg-danger-bg', text: 'text-danger-text' },
} as const;

/** 상태 칩 (높이 19 · 11 Bold · 모서리 8). 블록 색 위에 올라가므로 안전은 흰 바탕이다. */
export function StatusTag({ status, className }: StatusTagProps) {
    const style = STATUS_STYLE[status];

    return (
        <View className={cn('self-start rounded-8 px-2 py-0.75', style.container, className)}>
            <AppText className={cn('font-bold text-11', style.text)}>{style.label}</AppText>
        </View>
    );
}
