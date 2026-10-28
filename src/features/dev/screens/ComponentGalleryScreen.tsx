import { useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { Screen } from '@/shared/components/layout/Screen';
import { AmountText } from '@/shared/components/ui/AmountText';
import { AppText } from '@/shared/components/ui/AppText';
import { BlockBeaker } from '@/shared/components/ui/BlockBeaker';
import { BottomSheet } from '@/shared/components/ui/BottomSheet';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { StatusTag } from '@/shared/components/ui/StatusTag';

const FONT_SIZES = [
    'text-30',
    'text-24',
    'text-20',
    'text-17',
    'text-16',
    'text-15',
    'text-13',
    'text-12',
    'text-11',
    'text-10',
] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <View className="gap-3">
            <AppText className="font-bold text-20">{title}</AppText>
            {children}
        </View>
    );
}

/** 공통 컴포넌트 확인용 화면 (개발 모드에서만 /dev/components 로 들어간다) */
export function ComponentGalleryScreen() {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    return (
        <Screen>
            <ScrollView contentContainerClassName="gap-8 px-5 py-6">
                <Section title="글자">
                    {FONT_SIZES.map((size) => (
                        <AppText key={size} className={`${size} font-bold`}>
                            {size} 4,370,000
                        </AppText>
                    ))}
                    <AppText className="font-semibold">SemiBold 본문</AppText>
                    <AppText className="text-ink-sub">Regular 보조 설명</AppText>
                </Section>

                <Section title="버튼">
                    <Button title="50,000원 옮기기" />
                    <Button title="50,000원 옮기기" disabled />
                    <Button
                        title="50,000원 옮기기"
                        loadingTitle="확인하는 중"
                        isLoading={isLoading}
                        onPress={() => {
                            setIsLoading(true);
                            setTimeout(() => setIsLoading(false), 1500);
                        }}
                    />
                    <View className="flex-row gap-2">
                        <Button
                            title="절약 제안 보기"
                            variant="secondary"
                            size="md"
                            className="flex-1"
                        />
                        <Button title="다른 블록에서 채우기" size="md" className="flex-1" />
                    </View>
                    <View className="flex-row gap-2">
                        <Button title="미리보기" size="sm" className="flex-1" />
                        <Button title="괜찮아요" variant="secondary" size="sm" className="flex-1" />
                        <Button
                            title="비활성"
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            disabled
                        />
                    </View>
                </Section>

                <Section title="상태칩">
                    <View className="flex-row gap-2 rounded-16 bg-block-i-caution p-3">
                        <StatusTag status="SAFE" />
                        <StatusTag status="CAUTION" />
                        <StatusTag status="DANGER" />
                    </View>
                </Section>

                <Section title="비커 블록">
                    <AppText className="text-13 text-ink-sub">
                        크기 lg · md · sm · xs / 물 높이 fillRate / 상태별 채도
                    </AppText>
                    <View className="flex-row gap-2">
                        <BlockBeaker
                            name="저축"
                            amount={2000000}
                            color="j"
                            status="SAFE"
                            fillRate={67}
                            size="lg"
                            caption="목표 3,000,000  67%"
                            className="flex-1"
                        />
                        <View className="flex-1 gap-2">
                            <BlockBeaker
                                name="생활비"
                                amount={950000}
                                color="i"
                                status="CAUTION"
                                fillRate={63}
                                size="md"
                                caption="사용형  63% 남음"
                            />
                            <BlockBeaker
                                name="여행"
                                amount={320000}
                                color="o"
                                status="DANGER"
                                fillRate={15}
                                size="xs"
                            />
                            <View className="flex-row gap-2">
                                <BlockBeaker
                                    name="월세"
                                    amount={600000}
                                    color="l"
                                    status="SAFE"
                                    fillRate={100}
                                    size="sm"
                                    caption="D-11"
                                    className="flex-1"
                                />
                                <BlockBeaker
                                    name="구독"
                                    amount={0}
                                    color="z"
                                    status="DANGER"
                                    fillRate={0}
                                    size="sm"
                                    caption="D-2"
                                    className="flex-1"
                                />
                            </View>
                        </View>
                    </View>
                </Section>

                <Section title="금액">
                    <AmountText amount={4370000} className="text-30" showUnit={false} />
                    <AmountText amount={50000} tone="up" showSign />
                    <AmountText amount={-41000} tone="down" />
                    <AmountText amount={-12300} showUnit={false} className="font-semibold" />
                    <View className="rounded-16 bg-primary-900 p-4">
                        <AmountText amount={4370000} isOnDark className="text-24" />
                        <AmountText amount={50000} tone="up" showSign isOnDark />
                    </View>
                </Section>

                <Section title="카드">
                    <Card>
                        <AppText className="font-semibold">outline · 기본 카드</AppText>
                    </Card>
                    <Card variant="neutral">
                        <AppText className="font-semibold">neutral · 결과 목록</AppText>
                    </Card>
                    <Card variant="tinted" size="lg">
                        <AppText className="font-semibold">tinted · 큰 카드</AppText>
                    </Card>
                </Section>

                <Section title="바텀시트">
                    <Button
                        title="시트 열기"
                        variant="secondary"
                        onPress={() => setIsSheetOpen(true)}
                    />
                </Section>
            </ScrollView>

            <BottomSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                title="자금 이동"
            >
                <View className="gap-4">
                    <AppText className="text-ink-sub">
                        배경을 누르거나, 아래로 끌거나, 뒤로 가기로 닫혀요.
                    </AppText>
                    <Card variant="neutral">
                        <AppText className="font-bold">이동 전 검증</AppText>
                    </Card>
                    <Button title="50,000원 옮기기" onPress={() => setIsSheetOpen(false)} />
                </View>
            </BottomSheet>
        </Screen>
    );
}
