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
    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
    const isRestored = useAuthStore((state) => state.isRestored);
    const [isFontLoaded, fontError] = useAppFonts();
    // 로그인 상태를 복원하기 전에 화면을 띄우면 홈이 잠깐 보였다가 로그인으로 튈 수 있다.
    const isReady = (isFontLoaded || fontError !== null) && isRestored;

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
                    <Stack screenOptions={{ headerShown: false }}>
                        {/* 로그인한 사용자만 접근. 비로그인 상태면 로그인 화면으로 보낸다. */}
                        <Stack.Protected guard={isLoggedIn}>
                            <Stack.Screen name="(tabs)" />
                            {/* 가운데 에이전트 버튼: 아래에서 올라오는 전체 화면, 뒤로 가기로 닫힘 */}
                            <Stack.Screen
                                name="agent"
                                options={{
                                    presentation: 'fullScreenModal',
                                    animation: 'slide_from_bottom',
                                }}
                            />
                        </Stack.Protected>
                        {/* 로그인한 상태면 로그인 화면 대신 홈으로 보낸다. */}
                        <Stack.Protected guard={!isLoggedIn}>
                            <Stack.Screen name="(auth)/login" />
                        </Stack.Protected>
                        <Stack.Screen name="dev/components" />
                    </Stack>
                </BottomSheetModalProvider>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}
