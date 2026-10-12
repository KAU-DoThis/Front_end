import { cssInterop } from 'nativewind';
import type { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';

// 서드파티 컴포넌트는 cssInterop으로 등록해야 className이 적용된다.
cssInterop(SafeAreaView, { className: 'style' });

interface ScreenProps {
    children: ReactNode;
    className?: string;
}

/** 모든 화면의 최상위 컨테이너 (Safe Area + 기본 배경) */
export function Screen({ children, className }: ScreenProps) {
    return <SafeAreaView className={cn('flex-1 bg-white', className)}>{children}</SafeAreaView>;
}
