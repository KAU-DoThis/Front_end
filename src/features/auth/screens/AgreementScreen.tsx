import { Redirect, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, Image, ScrollView, View } from 'react-native';

import { useSignUpMutation } from '@/features/auth/api/useSignUpMutation';
import {
    AGREEMENT_ITEMS,
    AgreementList,
    INITIAL_AGREEMENT_STATE,
    type AgreementState,
} from '@/features/auth/components/AgreementList';
import { BackButton } from '@/features/auth/components/BackButton';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useSignUpStore } from '@/features/auth/stores/signUpStore';
import type { AgreementType } from '@/features/auth/types/auth';
import { Screen } from '@/shared/components/layout/Screen';
import { AppText } from '@/shared/components/ui/AppText';
import { Button } from '@/shared/components/ui/Button';

const LOCK_ICON = require('@/assets/icons/auth-lock.png');

/** 00-2 약관 동의: 동의하면 가입 요청을 보내고, 이메일 인증 때 받은 토큰으로 로그인한다. */
export function AgreementScreen() {
    const [agreements, setAgreements] = useState<AgreementState>(INITIAL_AGREEMENT_STATE);

    const email = useSignUpStore((state) => state.email);
    const password = useSignUpStore((state) => state.password);
    const verifiedTokens = useSignUpStore((state) => state.verifiedTokens);
    const login = useAuthStore((state) => state.login);
    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

    const { mutate: signUp, isPending, error } = useSignUpMutation();
    // 가입 요청이 끝나도(isPending=false) 토큰 저장(login)이 끝날 때까지는 다시 누르지 못하게 한다.
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const isSubmitting = isPending || isLoggingIn;
    // 가입은 됐는데 토큰 저장(login)이 실패하면, 다시 누를 때 가입 요청 없이 로그인만 다시 한다.
    const [isSignedUp, setIsSignedUp] = useState(false);
    const [hasLoginError, setHasLoginError] = useState(false);

    // 가입 요청 중에는 Android 뒤로 가기를 막는다. (도중에 나가도 요청이 끝나면 로그인되어 홈으로 튄다)
    useEffect(() => {
        if (!isSubmitting) return;
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
        return () => subscription.remove();
    }, [isSubmitting]);

    const hasRequiredAgreements = AGREEMENT_ITEMS.every(
        ({ type, isRequired }) => !isRequired || agreements[type],
    );
    const submitErrorMessage = hasLoginError
        ? '가입은 완료됐지만 로그인하지 못했어요. 다시 눌러 주세요'
        : error
          ? '가입하지 못했어요. 잠시 후 다시 시도해 주세요'
          : undefined;

    if (isLoggedIn) {
        return null;
    }

    // 입력 화면에서 이메일 인증을 마치지 않고 들어오면 처음부터 다시 입력받는다.
    if (!email || !verifiedTokens) {
        return <Redirect href="/sign-up" />;
    }

    const handlePressDetail = (_type: AgreementType) => {
        // TODO: 약관 본문이 나오면 약관 보기 화면을 연결한다.
    };

    const completeLogin = async () => {
        setIsLoggingIn(true);
        setHasLoginError(false);
        try {
            await login(verifiedTokens.accessToken, verifiedTokens.refreshToken);
        } catch {
            setHasLoginError(true);
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleSubmit = () => {
        if (!hasRequiredAgreements || isSubmitting) return;

        if (isSignedUp) {
            completeLogin();
            return;
        }

        signUp(
            {
                email,
                password,
                agreements: AGREEMENT_ITEMS.map(({ type }) => ({
                    type,
                    isAgreed: agreements[type],
                })),
            },
            {
                // 로그인 상태가 바뀌면 루트 레이아웃이 홈으로 보내고, 가입 입력값은 SignUpScreen이 지운다.
                // TODO: 프로필 입력·온보딩 화면이 생기면 가입 후 그쪽으로 보낸다. (인증 응답 메시지: 프로필을 입력해주세요)
                onSuccess: () => {
                    setIsSignedUp(true);
                    completeLogin();
                },
            },
        );
    };

    return (
        <Screen>
            {/* 가입 요청 중에는 iOS 스와이프 뒤로 가기를 막는다. */}
            <Stack.Screen options={{ gestureEnabled: !isSubmitting }} />
            <View className="px-3">
                <BackButton disabled={isSubmitting} />
            </View>
            <ScrollView contentContainerClassName="grow px-5 pb-6 pt-5">
                <View className="gap-2">
                    <AppText className="font-bold text-24">
                        {'핀트리스를 쓰려면\n동의가 필요해요'}
                    </AppText>
                    <AppText className="text-15 text-ink-sub">
                        계좌·카드 거래를 가져와 블록에 반영하려면 아래 내용에 동의해야 해요.
                    </AppText>
                </View>

                <View className="mt-6">
                    <AgreementList
                        value={agreements}
                        onChange={setAgreements}
                        onPressDetail={handlePressDetail}
                    />
                </View>

                <View className="mt-6 flex-row gap-2 rounded-12 bg-surface-neutral px-4 py-3.5">
                    <Image source={LOCK_ICON} className="mt-px h-4 w-4" />
                    <AppText className="flex-1 text-13">
                        가져온 금융 정보는 블록 계산과 분석에만 써요. 다른 곳에 팔거나 넘기지
                        않아요.
                    </AppText>
                </View>

                <View className="mt-auto gap-3 pt-10">
                    {submitErrorMessage && (
                        <AppText
                            className="text-center text-12 text-danger-text"
                            accessibilityLiveRegion="polite"
                        >
                            {submitErrorMessage}
                        </AppText>
                    )}
                    <Button
                        title="동의하고 계속"
                        loadingTitle="가입 중"
                        isLoading={isSubmitting}
                        disabled={!hasRequiredAgreements}
                        onPress={handleSubmit}
                    />
                </View>
            </ScrollView>
        </Screen>
    );
}
