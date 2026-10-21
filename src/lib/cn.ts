import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

import { fontFamily, fontSize, radius } from '@/styles/tokens';

/**
 * 프로젝트 토큰을 tailwind-merge에 알려준다.
 * 알려주지 않으면 text-15를 글자 색으로 보고 text-ink와 충돌한다고 판단해 지워버린다.
 */
const twMerge = extendTailwindMerge({
    override: {
        classGroups: {
            'font-weight': [{ font: Object.keys(fontFamily) }],
            'font-size': [{ text: Object.keys(fontSize) }],
            rounded: [{ rounded: ['none', 'full', ...radius.map(String)] }],
        },
    },
});

/** 조건부 className 합치기 + 충돌하는 Tailwind 클래스 정리 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
