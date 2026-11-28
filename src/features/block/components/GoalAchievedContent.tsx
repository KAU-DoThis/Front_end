import { useState } from 'react';
import { View } from 'react-native';

import { formatWon } from '@/lib/format';
import { AmountInput } from '@/shared/components/ui/AmountInput';
import { AppText } from '@/shared/components/ui/AppText';
import { Button } from '@/shared/components/ui/Button';
import { MiniBeaker } from '@/shared/components/ui/MiniBeaker';

import type { GoalBlockDetail } from '@/features/block/types/blockDetail';
import { monthsSince } from '@/features/block/utils/goalOutcome';

import { GoalChoiceCard } from './GoalChoiceCard';

/** PRODUCTS: 이 금액에 맞는 예·적금 보기 (19 금융상품 비교로 이동, 서버 처리 없음) */
type AchievedChoice = 'KEEP' | 'RAISE_TARGET' | 'MOVE' | 'PRODUCTS';

interface GoalAchievedContentProps {
    detail: GoalBlockDetail;
    today: string;
    /** 목표 올리기 금액 입력 단계인지 (시트 제목·뒤로 가기는 시트가 그린다) */
    isRaising: boolean;
    isPending: boolean;
    onKeep: () => void;
    onStartRaise: () => void;
    onRaise: (newTargetAmount: number) => void;
    onMove: () => void;
    onCompareProducts: () => void;
}

/** 17 목표 달성 시트 내용 — 모은 돈을 어떻게 할지 고른다. */
export function GoalAchievedContent({
    detail,
    today,
    isRaising,
    isPending,
    onKeep,
    onStartRaise,
    onRaise,
    onMove,
    onCompareProducts,
}: GoalAchievedContentProps) {
    const [choice, setChoice] = useState<AchievedChoice>('KEEP');
    const { block, targetAmount } = detail;

    if (isRaising) {
        return (
            <RaiseTargetForm targetAmount={targetAmount} isPending={isPending} onSubmit={onRaise} />
        );
    }

    const { startMonth, months } = monthsSince(block.startDate, today);
    const choices: { value: AchievedChoice; title: string; description: string }[] = [
        {
            value: 'KEEP',
            title: '그대로 지키기',
            description: '쓰지 않고 그대로 두고, 매달 넣는 건 멈춰요',
        },
        {
            value: 'RAISE_TARGET',
            title: '목표 올리기',
            description: `예) ${formatWon(targetAmount * 2)}까지 계속 모으기`,
        },
        {
            value: 'MOVE',
            title: '다른 블록으로 옮기기',
            description: '일부나 전부를 다른 블록으로',
        },
        {
            value: 'PRODUCTS',
            title: '이 금액에 맞는 예·적금 보기',
            description: '이자를 받을 수 있는 상품을 비교해요',
        },
    ];

    const handleConfirm = () => {
        switch (choice) {
            case 'KEEP':
                return onKeep();
            case 'RAISE_TARGET':
                return onStartRaise();
            case 'MOVE':
                return onMove();
            case 'PRODUCTS':
                return onCompareProducts();
        }
    };

    return (
        <View>
            <View className="items-center">
                <MiniBeaker size="lg" color={block.color} status={block.status} fillRate={100} />
                <AppText className="mt-4 text-center font-bold text-24">
                    {`${block.name} ${formatWon(targetAmount)}을\n다 모았어요`}
                </AppText>
                <AppText className="mt-2 text-center text-13 text-ink-sub">
                    {`${startMonth}월부터 ${months}개월 걸렸어요. 모은 돈을 어떻게 할까요?`}
                </AppText>
            </View>

            <View accessibilityRole="radiogroup" className="mt-6 gap-2">
                {choices.map((item) => (
                    <GoalChoiceCard
                        key={item.value}
                        title={item.title}
                        description={item.description}
                        isSelected={choice === item.value}
                        disabled={isPending}
                        onPress={() => setChoice(item.value)}
                    />
                ))}
            </View>

            <Button
                className="mt-10"
                title="확인"
                loadingTitle="반영하는 중"
                isLoading={isPending}
                onPress={handleConfirm}
            />
        </View>
    );
}

interface RaiseTargetFormProps {
    targetAmount: number;
    isPending: boolean;
    onSubmit: (newTargetAmount: number) => void;
}

/** 목표 올리기: 지금 목표보다 큰 금액만 받는다. 월 확보 금액은 서버가 다시 계산한다. */
function RaiseTargetForm({ targetAmount, isPending, onSubmit }: RaiseTargetFormProps) {
    const [amount, setAmount] = useState<number | null>(targetAmount * 2);
    const isTooSmall = amount !== null && amount <= targetAmount;
    const canSubmit = amount !== null && !isTooSmall && !isPending;

    return (
        <View>
            <AmountInput
                inSheet
                label="새 목표 금액"
                value={amount}
                onChangeValue={setAmount}
                disabled={isPending}
                errorMessage={
                    isTooSmall
                        ? `지금 목표(${formatWon(targetAmount)})보다 크게 정해 주세요`
                        : undefined
                }
                helperText={`지금 목표 ${formatWon(targetAmount)} · 매달 넣을 금액은 다시 계산해요`}
            />
            <Button
                className="mt-8"
                title="목표 올리기"
                loadingTitle="반영하는 중"
                isLoading={isPending}
                disabled={!canSubmit}
                onPress={() => amount !== null && canSubmit && onSubmit(amount)}
            />
        </View>
    );
}
