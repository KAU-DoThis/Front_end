import { View } from 'react-native';

import { cn } from '@/lib/cn';
import { AppText } from '@/shared/components/ui/AppText';

/** 블록 상태 (백엔드 enum 값과 맞춘다) */
export type Status = 'SAFE' | 'CAUTION' | 'DANGER';

interface StatusTagProps {
    status: Status;
    /** sm: 홈 블록 (19 · 11) / md: 블록 상세 카드 (22 · 12) */
    size?: 'sm' | 'md';
    /** 상태 뒤에 붙는 이유 (예: 소진 빠름). md에서 쓴다. */
    reason?: string;
    className?: string;
}

const STATUS_STYLE = {
    SAFE: { label: '안전', container: 'bg-white', text: 'text-ink-safe' },
    CAUTION: { label: '주의', container: 'bg-caution', text: 'text-caution-text' },
    DANGER: { label: '위험', container: 'bg-danger-bg', text: 'text-danger-text' },
} as const;

const SIZE_STYLE = {
    sm: { container: 'px-2 py-0.75', text: 'text-11' },
    md: { container: 'px-3 py-1', text: 'text-12' },
} as const;

/** 상태 칩 (모서리 8 · Bold). 블록 색 위에 올라가므로 안전은 흰 바탕이다. */
export function StatusTag({ status, size = 'sm', reason, className }: StatusTagProps) {
    const style = STATUS_STYLE[status];

    return (
        <View
            className={cn(
                'self-start rounded-8',
                SIZE_STYLE[size].container,
                style.container,
                className,
            )}
        >
            <AppText className={cn('font-bold', SIZE_STYLE[size].text, style.text)}>
                {reason ? `${style.label}  ${reason}` : style.label}
            </AppText>
        </View>
    );
}
