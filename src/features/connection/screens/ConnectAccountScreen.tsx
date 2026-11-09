import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, BackHandler, ScrollView, View } from 'react-native';

import { useConnectInstitutionsMutation } from '@/features/connection/api/useConnectInstitutionsMutation';
import { InstitutionTile } from '@/features/connection/components/InstitutionTile';
import { INSTITUTIONS, findInstitution } from '@/features/connection/constants/institutions';
import {
    CONNECTION_ERROR_CODE,
    type Institution,
    type InstitutionConnectionResult,
    type InstitutionType,
} from '@/features/connection/types/connection';
import { OnboardingHeader } from '@/shared/components/layout/OnboardingHeader';
import { Screen } from '@/shared/components/layout/Screen';
import { AppText } from '@/shared/components/ui/AppText';
import { Button } from '@/shared/components/ui/Button';
import { Icon } from '@/shared/components/ui/Icon';
import { SegmentedControl } from '@/shared/components/ui/SegmentedControl';
import { ONBOARDING_STEP, ONBOARDING_TOTAL_STEPS } from '@/shared/constants/onboarding';
import { useDelayedFlag } from '@/shared/hooks/useDelayedFlag';
import { ApiError } from '@/shared/types/api';
import { colors } from '@/styles/tokens';

/** CODEF 응답이 이보다 오래 걸리면 늦어지고 있다고 알려준다. (디자인 시스템 '화면 상태') */
const SLOW_RESPONSE_MS = 30_000;

const GRID_COLUMNS = 3;

const TYPE_LABEL: Record<InstitutionType, string> = { BANK: '은행', CARD: '카드' };
const MESSAGE_SOURCE_LABEL: Record<InstitutionType, string> = { BANK: '은행', CARD: '카드사' };

/** 3개씩 한 줄로 나눈다. 마지막 줄이 모자라면 빈칸(null)으로 채워 칸 너비를 맞춘다. */
function toRows(institutions: Institution[]) {
    const rows: (Institution | null)[][] = [];
    for (let index = 0; index < institutions.length; index += GRID_COLUMNS) {
        const row: (Institution | null)[] = institutions.slice(index, index + GRID_COLUMNS);
        while (row.length < GRID_COLUMNS) row.push(null);
        rows.push(row);
    }
    return rows;
}

/** 실패한 기관 결과를 '무엇이 왜 안 됐는지' 문장으로 바꾼다. (디자인 시스템 '오류 · 기관 인증 실패') */
function toFailureMessage(failures: InstitutionConnectionResult[]) {
    const [first] = failures;
    const name = findInstitution(first.institutionCode)?.name ?? '기관';
    const others = failures.length > 1 ? ` 외 ${failures.length - 1}곳` : '';
    return {
        title: `${name}${others} 인증에 실패했어요`,
        description: first.institutionMessage
            ? `${MESSAGE_SOURCE_LABEL[first.type]} 메시지: ${first.institutionMessage}`
            : '잠시 후 다시 시도해 주세요',
    };
}

interface ConnectAccountScreenProps {
    /**
     * 하나라도 연결되면 다음 단계로 보낸다. 연결하지 못한 기관은 빼고 진행하고, 그 코드를 같이 넘긴다.
     * (인증은 이미 끝난 뒤라 남은 실패는 계좌 없음·기관 점검처럼 바로 다시 해도 안 될 때가 많다)
     */
    onConnected: (failedCodes: string[]) => void;
    /** 닫기를 확인하면 부른다. (연동은 필수라 온보딩을 나간다) */
    onExit: () => void;
}

/** 00-4 계좌·카드 연동 (온보딩 1/3 · 연동 필수) */
export function ConnectAccountScreen({ onConnected, onExit }: ConnectAccountScreenProps) {
    const [tab, setTab] = useState<InstitutionType>('BANK');
    const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
    // 기관마다 결과가 따로 오므로, 먼저 연결된 곳은 다시 요청하지 않는다.
    const [connectedCodes, setConnectedCodes] = useState<Set<string>>(new Set());
    // 시도했지만 아직 연결하지 못한 기관 (다음 단계에 빠진 기관으로 알려준다)
    const [failedCodes, setFailedCodes] = useState<Set<string>>(new Set());
    // 하나도 연결하지 못했을 때 보여줄 실패 안내
    const [failures, setFailures] = useState<InstitutionConnectionResult[]>([]);

    const { mutate: connect, isPending, error, reset } = useConnectInstitutionsMutation();
    const isSlow = useDelayedFlag(isPending, SLOW_RESPONSE_MS);

    // 연결 중에는 Android 뒤로 가기를 막는다.
    useEffect(() => {
        if (!isPending) return;
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
        return () => subscription.remove();
    }, [isPending]);

    const countByType = (type: InstitutionType) =>
        INSTITUTIONS[type].filter(({ code }) => selectedCodes.has(code)).length;
    const bankCount = countByType('BANK');
    const cardCount = countByType('CARD');
    const selectedCount = bankCount + cardCount;

    const handleToggle = (code: string) => {
        // 고른 곳이 바뀌면 이전 실패 안내는 지운다.
        setFailures([]);
        reset();
        setSelectedCodes((prev) => {
            const next = new Set(prev);
            if (next.has(code)) {
                next.delete(code);
            } else {
                next.add(code);
            }
            return next;
        });
    };

    const handleConnect = () => {
        if (selectedCount === 0 || isPending) return;

        const institutions = [...INSTITUTIONS.BANK, ...INSTITUTIONS.CARD]
            .filter(({ code }) => selectedCodes.has(code))
            .map(({ type, code }) => ({ type, institutionCode: code }));

        setFailures([]);
        connect(
            { institutions },
            {
                onSuccess: ({ results }) => {
                    const connected = results.filter(({ status }) => status === 'CONNECTED');
                    const failed = results.filter(({ status }) => status === 'FAILED');
                    const nextConnected = new Set(connectedCodes);
                    connected.forEach(({ institutionCode }) => nextConnected.add(institutionCode));
                    const nextFailed = new Set(failedCodes);
                    failed.forEach(({ institutionCode }) => nextFailed.add(institutionCode));
                    // 전에 실패했다가 이번에 연결된 곳은 뺀다.
                    nextConnected.forEach((code) => nextFailed.delete(code));

                    setConnectedCodes(nextConnected);
                    setFailedCodes(nextFailed);

                    if (nextConnected.size > 0) {
                        // 연결된 곳이 있으면 실패한 곳은 빼고 바로 넘어간다.
                        setSelectedCodes(new Set());
                        setFailures([]);
                        onConnected([...nextFailed]);
                        return;
                    }
                    // 하나도 연결하지 못했으면 실패한 곳을 골라 둔 채로 남겨 다시 시도할 수 있게 한다.
                    setSelectedCodes(new Set(failed.map(({ institutionCode }) => institutionCode)));
                    setFailures(failed);
                },
            },
        );
    };

    const handleClose = () => {
        Alert.alert(
            '연결을 그만둘까요?',
            '계좌나 카드를 연결해야 핀트리스를 쓸 수 있어요. 로그아웃하고 처음 화면으로 돌아가요.',
            [
                { text: '계속 연결하기', style: 'cancel' },
                { text: '로그아웃', style: 'destructive', onPress: onExit },
            ],
        );
    };

    const failureMessage = failures.length > 0 ? toFailureMessage(failures) : null;
    const requestErrorMessage =
        error instanceof ApiError && error.code === CONNECTION_ERROR_CODE.RATE_LIMITED
            ? '요청이 많아 잠시 막혔어요. 1분 뒤에 다시 시도해 주세요'
            : error
              ? '연결하지 못했어요. 잠시 후 다시 시도해 주세요'
              : null;
    const summary =
        selectedCount > 0
            ? `${TYPE_LABEL.BANK} ${bankCount}곳  ${TYPE_LABEL.CARD} ${cardCount}곳 선택함`
            : '쓰고 있는 은행이나 카드를 골라 주세요';

    return (
        <Screen>
            {/* 연결 중에는 iOS 스와이프 뒤로 가기를 막는다. */}
            <Stack.Screen options={{ gestureEnabled: !isPending }} />
            <OnboardingHeader
                step={ONBOARDING_STEP.CONNECT}
                totalSteps={ONBOARDING_TOTAL_STEPS}
                onClose={handleClose}
                isCloseDisabled={isPending}
            />
            <ScrollView contentContainerClassName="px-5 pb-6 pt-5">
                <View className="gap-2">
                    <AppText className="font-bold text-24">
                        {'쓰고 있는 계좌와 카드를\n연결해요'}
                    </AppText>
                    <AppText className="text-15 text-ink-sub">
                        최근 3개월 거래를 가져와서 블록을 만들어 드려요
                    </AppText>
                </View>

                <SegmentedControl
                    className="mt-4"
                    options={[
                        { value: 'BANK', label: TYPE_LABEL.BANK, count: bankCount },
                        { value: 'CARD', label: TYPE_LABEL.CARD, count: cardCount },
                    ]}
                    value={tab}
                    onChange={setTab}
                />

                <View className="mt-4 gap-2">
                    {toRows(INSTITUTIONS[tab]).map((row, rowIndex) => (
                        <View key={rowIndex} className="flex-row gap-2">
                            {row.map((institution, columnIndex) =>
                                institution ? (
                                    <InstitutionTile
                                        key={institution.code}
                                        institution={institution}
                                        isSelected={selectedCodes.has(institution.code)}
                                        isConnected={connectedCodes.has(institution.code)}
                                        disabled={isPending}
                                        onPress={() => handleToggle(institution.code)}
                                    />
                                ) : (
                                    <View key={`empty-${columnIndex}`} className="flex-1" />
                                ),
                            )}
                        </View>
                    ))}
                </View>

                <View className="mt-4 flex-row gap-2">
                    <View className="mt-px">
                        <Icon name="lock" size={16} color={colors.ink.sub} />
                    </View>
                    <AppText className="flex-1 text-13 text-ink-sub">
                        인증서 비밀번호는 저장하지 않아요. 잔액과 거래 내역 조회만 하고 돈을 옮기지
                        않아요.
                    </AppText>
                </View>
            </ScrollView>

            <View className="gap-3 border-t border-line px-5 pb-6 pt-3">
                {failureMessage ? (
                    <View className="items-center gap-1" accessibilityLiveRegion="polite">
                        <AppText className="text-center font-bold text-13 text-danger-text">
                            {failureMessage.title}
                        </AppText>
                        <AppText className="text-center text-12 text-ink-sub">
                            {failureMessage.description}
                        </AppText>
                    </View>
                ) : requestErrorMessage ? (
                    <AppText
                        className="text-center text-13 text-danger-text"
                        accessibilityLiveRegion="polite"
                    >
                        {requestErrorMessage}
                    </AppText>
                ) : isSlow ? (
                    <AppText
                        className="text-center text-13 text-ink-sub"
                        accessibilityLiveRegion="polite"
                    >
                        은행 응답이 늦어지고 있어요. 조금만 더 기다려 주세요
                    </AppText>
                ) : (
                    <AppText className="text-center text-13 text-ink-sub">{summary}</AppText>
                )}
                {/* 다 연결하고 이 화면으로 돌아왔으면 더 고를 것 없이 다음으로 넘어간다. */}
                {selectedCount === 0 && connectedCodes.size > 0 ? (
                    <Button
                        title={`연결된 ${connectedCodes.size}곳으로 계속하기`}
                        onPress={() => onConnected([...failedCodes])}
                    />
                ) : (
                    <Button
                        title={
                            selectedCount > 0
                                ? `간편인증으로 ${selectedCount}곳 연결`
                                : '간편인증으로 연결'
                        }
                        loadingTitle="연결하는 중"
                        isLoading={isPending}
                        disabled={selectedCount === 0}
                        onPress={handleConnect}
                    />
                )}
            </View>
        </Screen>
    );
}
