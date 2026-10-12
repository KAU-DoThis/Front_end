import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** 조건부 className 합치기 + 충돌하는 Tailwind 클래스 정리 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
