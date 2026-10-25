import { View, type ViewProps } from 'react-native';

import { cn } from '@/lib/cn';

type CardVariant = 'outline' | 'neutral' | 'tinted';
type CardSize = 'md' | 'lg';

interface CardProps extends ViewProps {
    /** outline: 흰 카드 + 테두리 / neutral: 회색 결과 카드 / tinted: 청록 강조 카드 */
    variant?: CardVariant;
    /** md: 카드(모서리 16) / lg: 큰 카드(모서리 24) */
    size?: CardSize;
    className?: string;
}

const VARIANT_CLASS = {
    outline: 'border border-line bg-white',
    neutral: 'bg-surface-neutral',
    tinted: 'bg-primary-50',
} as const;

const SIZE_CLASS = {
    md: 'rounded-16 p-4',
    lg: 'rounded-24 p-5',
} as const;

/** 카드 공통 컨테이너. 안쪽 배치는 className으로 정한다. */
export function Card({ variant = 'outline', size = 'md', className, ...props }: CardProps) {
    return <View className={cn(VARIANT_CLASS[variant], SIZE_CLASS[size], className)} {...props} />;
}
