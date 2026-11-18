import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    View,
} from 'react-native';

import { useLoginMutation } from '@/features/auth/api/useLoginMutation';
import {
    createSocialAccount,
    getSavedSocialAccount,
    saveSocialAccount,
} from '@/features/auth/lib/socialAccount';
import { useSignUpStore } from '@/features/auth/stores/signUpStore';
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
    if (error instanceof ApiError) {
        if (error.code === AUTH_ERROR_CODE.INVALID_CREDENTIALS) {
            return '이메일 또는 비밀번호가 맞지 않아요';
        }
        if (error.code === AUTH_ERROR_CODE.ACCOUNT_LOCKED) {
            return '로그인에 5번 실패해서 10분 동안 잠겼어요. 잠시 후 다시 시도해 주세요';
        }
    }
    return '로그인하지 못했어요. 잠시 후 다시 시도해 주세요';
}

interface SocialButtonProps {
    title: string;
    icon: number;
    iconClassName: string;
    className: string;
    textClassName: string;
    /** 로그인 요청 중에는 눌리지 않고 흐리게 보인다. */
    disabled?: boolean;
    onPress: () => void;
}

// 56 · 16 · 16 Bold, 아이콘은 왼쪽에 두고 글자는 가운데
function SocialButton({
    title,
    icon,
    iconClassName,
    className,
    textClassName,
    disabled = false,
    onPress,
}: SocialButtonProps) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            disabled={disabled}
            className={cn(
                'h-14 justify-center rounded-16 px-6 active:opacity-80',
                disabled && 'opacity-50',
                className,
            )}
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
    // 소셜 버튼 오류가 비밀번호 칸에 뜨지 않도록 따로 둔다.
    const { mutate: socialLogin, isPending: isSocialLoginPending } = useLoginMutation();
    // 저장된 기기 계정을 읽는 동안에도 버튼을 막는다.
    const [isSocialPreparing, setIsSocialPreparing] = useState(false);
    const isSocialPending = isSocialLoginPending || isSocialPreparing;

    const setSignUpCredentials = useSignUpStore((state) => state.setCredentials);
    const resetSignUp = useSignUpStore((state) => state.reset);

    // 소셜 버튼으로 약관 화면에 갔다가 로그인하면 이 화면이 사라진다. 가입 입력값(비밀번호 포함)을 지운다.
    useEffect(() => resetSignUp, [resetSignUp]);

    const trimmedEmail = email.trim();
    const isEmailValid = EMAIL_REGEX.test(trimmedEmail);
    const showEmailError = isEmailTouched && trimmedEmail.length > 0 && !isEmailValid;
    const canSubmit = isEmailValid && password.length > 0;
    // 이메일 로그인과 소셜 로그인 요청이 같이 나가지 않도록 하나라도 진행 중이면 둘 다 막는다.
    const isAnyLoginPending = isPending || isSocialPending;

    const handleChangeEmail = (value: string) => {
        setEmail(value);
        if (error) reset();
    };

    const handleChangePassword = (value: string) => {
        setPassword(value);
        if (error) reset();
    };

    const handleLogin = () => {
        if (!canSubmit || isAnyLoginPending) return;

        login(
            { email: trimmedEmail, password },
            {
                onSuccess: () => router.replace('/'),
            },
        );
    };

    const handleSignUp = () => {
        // 소셜 버튼으로 약관 화면에 갔다 돌아왔으면 그때 고른 동의가 남지 않게 비운다.
        resetSignUp();
        router.push('/sign-up');
    };

    /** 새 기기 계정을 만들어 약관 동의 화면으로 보낸다. 동의하면 가입 후 온보딩으로 간다. */
    const startSocialSignUp = async () => {
        const account = createSocialAccount();
        try {
            await saveSocialAccount(account);
        } catch {
            // 저장하지 못해도 가입은 진행한다. 다음에 누르면 새 계정으로 다시 가입한다.
        }
        resetSignUp();
        setSignUpCredentials(account.email, account.password);
        router.push('/agreement');
    };

    // 실제 OAuth 대신 기기 계정으로 로그인한다. (lib/socialAccount 참고)
    // 처음이면 약관 동의부터, 가입한 기기면 로그인 후 서버 온보딩 상태에 따라 온보딩이나 홈으로 간다.
    // TODO: 카카오/구글 OAuth 연동 (별도 이슈)
    const handleSocialLogin = async () => {
        if (isAnyLoginPending) return;

        setIsSocialPreparing(true);
        try {
            const savedAccount = await getSavedSocialAccount();
            if (!savedAccount) {
                await startSocialSignUp();
                return;
            }
            socialLogin(savedAccount, {
                onSuccess: () => router.replace('/'),
                onError: (loginError) => {
                    // 가입하지 않고 나갔거나 서버에서 계정이 지워졌으면 새로 가입한다.
                    if (
                        loginError instanceof ApiError &&
                        loginError.code === AUTH_ERROR_CODE.INVALID_CREDENTIALS
                    ) {
                        void startSocialSignUp();
                        return;
                    }
                    Alert.alert('로그인하지 못했어요', '잠시 후 다시 시도해 주세요');
                },
            });
        } finally {
            setIsSocialPreparing(false);
        }
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
                            disabled={!canSubmit || isSocialPending}
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
                            disabled={isAnyLoginPending}
                            onPress={handleSocialLogin}
                        />
                        <SocialButton
                            title="Google로 시작하기"
                            icon={GOOGLE_ICON}
                            iconClassName="h-6 w-6"
                            className="border border-line-control bg-white"
                            textClassName="text-ink"
                            disabled={isAnyLoginPending}
                            onPress={handleSocialLogin}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </Screen>
    );
}
