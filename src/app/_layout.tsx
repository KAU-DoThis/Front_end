import '@/styles/global.css';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useAuthStore } from '@/features/auth/stores/authStore';
import { queryClient } from '@/lib/queryClient';
import { useAppFonts } from '@/shared/hooks/useAppFonts';

// 폰트를 불러오기 전까지 스플래시를 유지한다.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const restore = useAuthStore((state) => state.restore);
    const [isFontLoaded, fontError] = useAppFonts();
    const isReady = isFontLoaded || fontError !== null;

    useEffect(() => {
        restore();
    }, [restore]);

    useEffect(() => {
        if (isReady) {
            SplashScreen.hide();
        }
    }, [isReady]);

    // 폰트 로딩에 실패하면 시스템 폰트로라도 화면을 띄운다.
    if (!isReady) {
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <QueryClientProvider client={queryClient}>
                <BottomSheetModalProvider>
                    <StatusBar style="dark" />
                    <Stack screenOptions={{ headerShown: false }} />
                </BottomSheetModalProvider>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}
