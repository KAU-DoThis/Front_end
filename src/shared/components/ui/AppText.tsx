import { Text, type TextProps } from 'react-native';

import { cn } from '@/lib/cn';

interface AppTextProps extends TextProps {
    className?: string;
}

/**
 * 앱 기본 글자 (Pretendard Regular · 15 · text/default)
 * RN Text는 폰트가 상속되지 않으므로 글자는 항상 이 컴포넌트로 쓴다.
 * 크기·굵기·색은 className 토큰으로 바꾼다. (text-17 font-bold text-ink-sub …)
 */
export function AppText({ className, style, ...props }: AppTextProps) {
    return (
        <Text
            className={cn('font-regular text-15 text-ink', className)}
            // Android에서 폰트 위아래 여백 때문에 글자가 아래로 치우치는 것을 막는다.
            style={[{ includeFontPadding: false }, style]}
            {...props}
        />
    );
}
