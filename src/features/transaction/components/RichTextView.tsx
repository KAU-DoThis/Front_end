import { AppText } from '@/shared/components/ui/AppText';

import type { RichText } from '@/features/transaction/types/transaction';

interface RichTextViewProps {
    parts: RichText;
    /** 바깥 글자 크기·색·행간 (굵기는 parts가 정한다) */
    className?: string;
}

/** 서버가 준 문장을 굵은 부분만 Bold로 그린다. */
export function RichTextView({ parts, className }: RichTextViewProps) {
    return (
        <AppText className={className}>
            {parts.map(({ text, isBold }, index) => (
                <AppText key={index} className={isBold ? `font-bold ${className}` : className}>
                    {text}
                </AppText>
            ))}
        </AppText>
    );
}
