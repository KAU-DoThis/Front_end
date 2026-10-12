import '@/styles/global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useAuthStore } from '@/features/auth/stores/authStore';
import { queryClient } from '@/lib/queryClient';

export default function RootLayout() {
    const restore = useAuthStore((state) => state.restore);

    useEffect(() => {
        restore();
    }, [restore]);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <QueryClientProvider client={queryClient}>
                <StatusBar style="dark" />
                <Stack screenOptions={{ headerShown: false }} />
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}
