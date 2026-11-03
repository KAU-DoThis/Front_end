// import { router } from 'expo-router'; <-약관동의 화면 연결시 사용
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { useSendVerificationCodeMutation } from '@/features/auth/api/useSendVerificationCodeMutation';
import { useVerifyEmailMutation } from '@/features/auth/api/useVerifyEmailMutation';
import { BackButton } from '@/features/auth/components/BackButton';
import { useCountdown } from '@/features/auth/hooks/useCountdown';
import { useSignUpStore } from '@/features/auth/stores/signUpStore';
import { AUTH_ERROR_CODE } from '@/features/auth/types/auth';
import { Screen } from '@/shared/components/layout/Screen';
import { AppText } from '@/shared/components/ui/AppText';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { ApiError } from '@/shared/types/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// TODO: 비밀번호 규칙이 명세에 나오면 맞춘다. (지금은 8~20자, 영문·숫자·특수문자 포함으로 가정)
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d\s])\S{8,20}$/;

const CODE_LENGTH = 6;

// TODO: 인증번호 유효 시간이 명세에 나오면 맞춘다. (지금은 5분으로 가정)
const CODE_TTL_SECONDS = 5 * 60;

// 입력칸 옆 버튼은 입력칸 높이(56)·모서리(12)에 맞춘다.
const FIELD_BUTTON_CLASS = 'h-14 rounded-12';

function formatRemaining(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function hasErrorCode(error: Error | null, code: string) {
    return error instanceof ApiError && error.code === code;
}

/** 00-1 회원가입: 이메일 인증 + 비밀번호 입력 → 약관 동의 */
export function SignUpScreen() {
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [isEmailTouched, setIsEmailTouched] = useState(false);
    const [isPasswordTouched, setIsPasswordTouched] = useState(false);
    /** 인증번호를 보낸 이메일. 이메일을 고치면 인증을 처음부터 다시 한다. */
    const [codeSentEmail, setCodeSentEmail] = useState<string | null>(null);

    const setCredentials = useSignUpStore((state) => state.setCredentials);
    const resetSignUp = useSignUpStore((state) => state.reset);

    const sendCode = useSendVerificationCodeMutation();
    const verify = useVerifyEmailMutation();
    const countdown = useCountdown(CODE_TTL_SECONDS);

    // 가입 흐름을 벗어나면(뒤로 가기, 가입 후 로그인) 입력값과 토큰을 지운다.
    useEffect(() => resetSignUp, [resetSignUp]);

    const trimmedEmail = email.trim();
    const isEmailValid = EMAIL_REGEX.test(trimmedEmail);
    const isCodeSent = codeSentEmail !== null;
    const verifiedTokens = verify.data ?? null;
    const isEmailVerified = verifiedTokens !== null;
    const isCodeExpired = isCodeSent && !isEmailVerified && countdown.isFinished;
    const isPasswordValid = PASSWORD_REGEX.test(password);
    const isPasswordConfirmed = passwordConfirm.length > 0 && passwordConfirm === password;
    const canSubmit = isEmailVerified && isPasswordValid && isPasswordConfirmed;

    const emailErrorMessage = hasErrorCode(sendCode.error, AUTH_ERROR_CODE.EMAIL_ALREADY_EXISTS)
        ? '이미 가입된 이메일이에요'
        : sendCode.error
          ? '인증번호를 보내지 못했어요. 잠시 후 다시 시도해 주세요'
          : isEmailTouched && trimmedEmail.length > 0 && !isEmailValid
            ? '이메일 형식을 확인해 주세요'
            : undefined;
    const emailHelperText = isEmailVerified
        ? '이메일 인증을 마쳤어요'
        : isCodeSent
          ? '인증번호를 보냈어요. 메일함을 확인해 주세요'
          : undefined;
    const codeErrorMessage = isCodeExpired
        ? '인증번호가 만료됐어요. 다시 받아 주세요'
        : hasErrorCode(verify.error, AUTH_ERROR_CODE.INVALID_VERIFICATION_CODE)
          ? '인증번호가 맞지 않아요. 다시 확인해 주세요'
          : hasErrorCode(verify.error, AUTH_ERROR_CODE.VERIFICATION_CODE_EXPIRED)
            ? '인증번호가 만료됐어요. 다시 받아 주세요'
            : verify.error
              ? '인증하지 못했어요. 잠시 후 다시 시도해 주세요'
              : undefined;
    const passwordErrorMessage =
        isPasswordTouched && password.length > 0 && !isPasswordValid
            ? '영문, 숫자, 특수문자를 포함해 8~20자로 입력해 주세요'
            : undefined;
    const passwordConfirmErrorMessage =
        passwordConfirm.length > 0 && !isPasswordConfirmed
            ? '비밀번호가 일치하지 않아요'
            : undefined;

    const handleChangeEmail = (value: string) => {
        setEmail(value);
        if (sendCode.error) sendCode.reset();
        // 인증번호를 받은 뒤 이메일을 고치면 인증을 처음부터 다시 한다.
        if (codeSentEmail !== null && value.trim() !== codeSentEmail) {
            setCodeSentEmail(null);
            setCode('');
            verify.reset();
        }
    };

    const handleSendCode = () => {
        if (!isEmailValid || sendCode.isPending || isEmailVerified) return;
        verify.reset();
        sendCode.mutate(
            { email: trimmedEmail },
            {
                onSuccess: () => {
                    setCodeSentEmail(trimmedEmail);
                    setCode('');
                    countdown.restart();
                },
            },
        );
    };

    const handleChangeCode = (value: string) => {
        setCode(value.replace(/\D/g, '').slice(0, CODE_LENGTH));
        if (verify.error) verify.reset();
    };

    const handleVerify = () => {
        if (!codeSentEmail || code.length !== CODE_LENGTH || isCodeExpired || verify.isPending) {
            return;
        }
        verify.mutate({ email: codeSentEmail, code });
    };

    const handleSubmit = () => {
        if (!canSubmit || !codeSentEmail || !verifiedTokens) return;
        setCredentials(codeSentEmail, password, verifiedTokens);
        // router.push('/agreement'); <- 이후구현할 것 미리적어놓음(약관동의화면으로 이동)
    };

    return (
        <Screen>
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View className="px-3">
                    <BackButton />
                </View>
                <ScrollView
                    contentContainerClassName="grow gap-6 px-5 pb-10 pt-3"
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="gap-2 pb-2">
                        <AppText className="font-bold text-24">이메일로 시작하기</AppText>
                        <AppText className="text-15 text-ink-sub">
                            계정을 만들고 블록을 쌓아 보세요
                        </AppText>
                    </View>

                    <View className="gap-6">
                        <View className="gap-3">
                            <Input
                                label="이메일"
                                placeholder="name@email.com"
                                value={email}
                                onChangeText={handleChangeEmail}
                                onBlur={() => setIsEmailTouched(true)}
                                errorMessage={emailErrorMessage}
                                helperText={emailHelperText}
                                // 보내는 중에 이메일을 고치면 화면과 다른 이메일로 인증·가입되므로 잠근다.
                                disabled={sendCode.isPending}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                                textContentType="emailAddress"
                                returnKeyType="next"
                                onSubmitEditing={handleSendCode}
                                accessory={
                                    <Button
                                        title={
                                            isEmailVerified
                                                ? '인증 완료'
                                                : isCodeSent
                                                  ? '다시 받기'
                                                  : '인증번호 받기'
                                        }
                                        loadingTitle="보내는 중"
                                        variant="secondary"
                                        size="md"
                                        className={FIELD_BUTTON_CLASS}
                                        isLoading={sendCode.isPending}
                                        disabled={!isEmailValid || isEmailVerified}
                                        onPress={handleSendCode}
                                    />
                                }
                            />

                            {isCodeSent && !isEmailVerified && (
                                <View className="gap-2">
                                    <Input
                                        accessibilityLabel="인증번호"
                                        placeholder="인증번호 6자리"
                                        value={code}
                                        onChangeText={handleChangeCode}
                                        errorMessage={codeErrorMessage}
                                        keyboardType="number-pad"
                                        maxLength={CODE_LENGTH}
                                        autoComplete="one-time-code"
                                        textContentType="oneTimeCode"
                                        autoFocus
                                        returnKeyType="done"
                                        onSubmitEditing={handleVerify}
                                        accessory={
                                            <Button
                                                title="확인"
                                                loadingTitle="확인 중"
                                                size="md"
                                                className={FIELD_BUTTON_CLASS}
                                                isLoading={verify.isPending}
                                                disabled={
                                                    code.length !== CODE_LENGTH || isCodeExpired
                                                }
                                                onPress={handleVerify}
                                            />
                                        }
                                    />
                                    {!isCodeExpired && (
                                        <AppText
                                            className="text-13 text-ink-sub"
                                            accessibilityLabel={`남은 시간 ${Math.floor(countdown.remainingSeconds / 60)}분 ${countdown.remainingSeconds % 60}초`}
                                        >
                                            {`남은 시간 ${formatRemaining(countdown.remainingSeconds)}`}
                                        </AppText>
                                    )}
                                </View>
                            )}
                        </View>

                        <Input
                            label="비밀번호"
                            placeholder="영문, 숫자, 특수문자 포함 8~20자"
                            value={password}
                            onChangeText={setPassword}
                            onBlur={() => setIsPasswordTouched(true)}
                            errorMessage={passwordErrorMessage}
                            helperText={isPasswordValid ? '사용할 수 있는 비밀번호에요' : undefined}
                            secureTextEntry
                            autoComplete="new-password"
                            textContentType="newPassword"
                            returnKeyType="next"
                        />
                        <Input
                            label="비밀번호 확인"
                            placeholder="비밀번호를 한 번 더 입력해 주세요"
                            value={passwordConfirm}
                            onChangeText={setPasswordConfirm}
                            errorMessage={passwordConfirmErrorMessage}
                            secureTextEntry
                            autoComplete="new-password"
                            textContentType="newPassword"
                            returnKeyType="done"
                        />
                    </View>

                    <Button
                        title="가입하기"
                        className="mt-auto"
                        disabled={!canSubmit}
                        onPress={handleSubmit}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </Screen>
    );
}
