import type { TextProps } from 'react-native';

import { cn } from '@/lib/cn';
import { formatAmount } from '@/lib/format';
import { AppText } from '@/shared/components/ui/AppText';

/**
 * up: 내 돈이 늘어나는 쪽 (입금 · 절약 · 지출 감소) → 파랑
 * down: 줄어드는 쪽 (지출 증가 · 초과 · 부족) → 빨강
 * default: 평범한 금액 · 거래 목록의 지출 → 기본 글자색
 */
type AmountTone = 'default' | 'up' | 'down';

interface AmountTextProps extends Omit<TextProps, 'children'> {
    /** 원 단위 정수 (서버 값을 그대로 넘긴다) */
    amount: number;
    tone?: AmountTone;
    /** 양수 앞에 +를 붙인다. */
    showSign?: boolean;
    /** 뒤에 "원"을 붙인다. */
    showUnit?: boolean;
    /** 어두운 카드(primary-900) 위에 올라갈 때 */
    isOnDark?: boolean;
    className?: string;
}

const TONE_CLASS = {
    light: { default: 'text-ink', up: 'text-delta-up', down: 'text-delta-down' },
    // 어두운 카드 위 빨강은 시안에 정의가 없어 밝은 면과 같은 값을 쓴다.
    dark: { default: 'text-white', up: 'text-delta-up-on-dark', down: 'text-delta-down' },
} as const;

/** 금액 표시. 크기·굵기는 className으로 정한다. (기본 15 Bold) */
export function AmountText({
    amount,
    tone = 'default',
    showSign = false,
    showUnit = true,
    isOnDark = false,
    className,
    ...props
}: AmountTextProps) {
    return (
        <AppText
            className={cn('font-bold', TONE_CLASS[isOnDark ? 'dark' : 'light'][tone], className)}
            {...props}
        >
            {formatAmount(amount, { showSign, showUnit })}
        </AppText>
    );
}
