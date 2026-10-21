import { cssInterop } from 'nativewind';
import type { ReactNode } from 'react';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';

// 서드파티 컴포넌트는 cssInterop으로 등록해야 className이 적용된다.
cssInterop(SafeAreaView, { className: 'style' });

interface ScreenProps {
    children: ReactNode;
    className?: string;
    /** Safe Area를 적용할 방향. 하단 탭 화면은 탭 바가 아래 여백을 처리하므로 ['top']만 쓴다. */
    edges?: Edge[];
}

/** 모든 화면의 최상위 컨테이너 (Safe Area + 기본 배경) */
export function Screen({ children, className, edges }: ScreenProps) {
    return (
        <SafeAreaView edges={edges} className={cn('flex-1 bg-white', className)}>
            {children}
        </SafeAreaView>
    );
}
