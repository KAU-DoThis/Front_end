import { router } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';

import { useLoginMutation } from '@/features/auth/api/useLoginMutation';
import { AUTH_ERROR_CODE } from '@/features/auth/types/auth';
import { cn } from '@/lib/cn';
import { Screen } from '@/shared/components/layout/Screen';
import { AppText } from '@/shared/components/ui/AppText';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { ApiError } from '@/shared/types/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LOGO_IMAGE = require('@/assets/images/auth-logo.png');
const KAKAO_ICON = require('@/assets/icons/auth-kakao.png');
const GOOGLE_ICON = require('@/assets/icons/auth-google.png');

function getLoginErrorMessage(error: Error) {
    if (error instanceof ApiError && error.code === AUTH_ERROR_CODE.INVALID_CREDENTIALS) {
        return '이메일 또는 비밀번호가 맞지 않아요';
    }
    return '로그인하지 못했어요. 잠시 후 다시 시도해 주세요';
}

interface SocialButtonProps {
    title: string;
    icon: number;
    iconClassName: string;
    className: string;
    textClassName: string;
    onPress: () => void;
}

// 56 · 16 · 16 Bold, 아이콘은 왼쪽에 두고 글자는 가운데
function SocialButton({
    title,
    icon,
    iconClassName,
    className,
    textClassName,
    onPress,
}: SocialButtonProps) {
    return (
        <Pressable
            accessibilityRole="button"
            className={cn('h-14 justify-center rounded-16 px-6 active:opacity-80', className)}
            onPress={onPress}
        >
            <Image source={icon} className={cn('absolute left-6', iconClassName)} />
            <AppText className={cn('text-center font-bold text-16', textClassName)}>
                {title}
            </AppText>
        </Pressable>
    );
}

export function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isEmailTouched, setIsEmailTouched] = useState(false);

    const { mutate: login, isPending, error, reset } = useLoginMutation();

    const trimmedEmail = email.trim();
    const isEmailValid = EMAIL_REGEX.test(trimmedEmail);
    const showEmailError = isEmailTouched && trimmedEmail.length > 0 && !isEmailValid;
    const canSubmit = isEmailValid && password.length > 0;

    const handleChangeEmail = (value: string) => {
        setEmail(value);
        if (error) reset();
    };

    const handleChangePassword = (value: string) => {
        setPassword(value);
        if (error) reset();
    };

    const handleLogin = () => {
        if (!canSubmit || isPending) return;

        login(
            { email: trimmedEmail, password },
            {
                // TODO: 온보딩 라우트가 생기면 hasLinkedAccount가 false일 때 계좌 연결로 보낸다.
                onSuccess: () => router.replace('/'),
            },
        );
    };

    const handleSignUp = () => {
        // TODO: 회원가입 라우트((auth)/sign-up)가 생기면 연결
    };

    const handleSocialLogin = () => {
        // TODO: 카카오/구글 OAuth 연동 (별도 이슈). 신규 사용자는 약관 동의부터 진행
    };

    return (
        <Screen>
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerClassName="grow gap-6 px-6 pb-10 pt-16"
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="items-center gap-3 px-6">
                        <Image source={LOGO_IMAGE} />
                        <AppText className="font-semibold text-30">핀트리스</AppText>
                        <AppText className="text-12 text-ink-sub">
                            목적별로 나눠 쌓는 내 돈, 블록으로 한눈에
                        </AppText>
                    </View>

                    <View className="gap-1.5 p-2.5">
                        <Input
                            className="py-2.5"
                            label="이메일"
                            placeholder="name@email.com"
                            value={email}
                            onChangeText={handleChangeEmail}
                            onBlur={() => setIsEmailTouched(true)}
                            errorMessage={
                                showEmailError ? '이메일 형식을 확인해 주세요' : undefined
                            }
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            textContentType="emailAddress"
                            returnKeyType="next"
                        />
                        <Input
                            className="py-2.5"
                            label="비밀번호"
                            placeholder="비밀번호"
                            value={password}
                            onChangeText={handleChangePassword}
                            errorMessage={error ? getLoginErrorMessage(error) : undefined}
                            secureTextEntry
                            autoComplete="current-password"
                            textContentType="password"
                            returnKeyType="done"
                            onSubmitEditing={handleLogin}
                        />
                        <Button
                            title="로그인"
                            loadingTitle="로그인 중"
                            isLoading={isPending}
                            disabled={!canSubmit}
                            onPress={handleLogin}
                        />
                    </View>

                    <View className="gap-2.5">
                        <Pressable
                            accessibilityRole="link"
                            className="h-10 flex-row items-center justify-center"
                            onPress={handleSignUp}
                        >
                            <AppText className="text-13 text-ink-sub">아직 계정이 없나요? </AppText>
                            <AppText className="font-bold text-13 text-ink-sub">
                                이메일로 회원가입
                            </AppText>
                        </Pressable>
                        <View className="h-10 flex-row items-center gap-3">
                            <View className="h-px flex-1 bg-line" />
                            <AppText className="text-12 text-ink-disabled">또는</AppText>
                            <View className="h-px flex-1 bg-line" />
                        </View>
                    </View>

                    <View className="gap-3 p-2.5">
                        <SocialButton
                            title="카카오로 시작하기"
                            icon={KAKAO_ICON}
                            iconClassName="h-6 w-6.5"
                            className="bg-kakao"
                            textClassName="text-kakao-label"
                            onPress={handleSocialLogin}
                        />
                        <SocialButton
                            title="Google로 시작하기"
                            icon={GOOGLE_ICON}
                            iconClassName="h-6 w-6"
                            className="border border-line-control bg-white"
                            textClassName="text-ink"
                            onPress={handleSocialLogin}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </Screen>
    );
}
