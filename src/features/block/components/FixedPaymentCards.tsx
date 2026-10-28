import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import { AppText } from '@/shared/components/ui/AppText';
import { Card } from '@/shared/components/ui/Card';
import { Toggle } from '@/shared/components/ui/Toggle';

import type { FixedBlockDetail } from '@/features/block/types/blockDetail';

interface RuleRowProps {
    label: string;
    value: string;
    isLast?: boolean;
}

function RuleRow({ label, value, isLast = false }: RuleRowProps) {
    return (
        <View
            className={cn(
                'h-[43px] flex-row items-center justify-between',
                !isLast && 'border-b border-line-soft',
            )}
        >
            <AppText className="text-13 text-ink-sub">{label}</AppText>
            <AppText className="font-semibold text-15">{value}</AppText>
        </View>
    );
}

interface PaymentRuleCardProps {
    rule: FixedBlockDetail['matchRule'];
    /** 고치기 (블록 규칙 수정 화면에서 연결) */
    onEdit?: () => void;
}

/** 납부 확인 조건 (시안 02-2) */
export function PaymentRuleCard({ rule, onEdit }: PaymentRuleCardProps) {
    return (
        <Card>
            <View className="flex-row items-center justify-between">
                <AppText className="font-bold text-15">납부 확인 조건</AppText>
                <Pressable
                    accessibilityRole="button"
                    hitSlop={12}
                    onPress={onEdit}
                    className="active:opacity-60"
                >
                    <AppText className="font-semibold text-13 text-primary-700">고치기</AppText>
                </Pressable>
            </View>
            <AppText className="mt-1 text-12 leading-[18px] text-ink-sub">
                이 조건에 맞는 출금이 나가면 &apos;납부 완료&apos;로 바꾸고, 블록은 다음 달 배분 때
                다시 채워요.
            </AppText>
            <View className="mt-1">
                <RuleRow label="받는 분" value={rule.payee} />
                <RuleRow label="금액" value={rule.amountText} />
                <RuleRow label="날짜" value={rule.dateText} />
                <RuleRow label="나가는 계좌" value={rule.accountLabel} isLast />
            </View>
        </Card>
    );
}

interface AlertRowProps {
    title: string;
    description?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
}

function AlertRow({ title, description, value, onValueChange }: AlertRowProps) {
    return (
        <View className="flex-row items-center gap-3 border-t border-line-soft py-3">
            <View className="flex-1 gap-0.5">
                <AppText className="font-semibold text-15">{title}</AppText>
                {description && <AppText className="text-12 text-ink-sub">{description}</AppText>}
            </View>
            <Toggle value={value} onValueChange={onValueChange} accessibilityLabel={title} />
        </View>
    );
}

interface PaymentAlertCardProps {
    alerts: FixedBlockDetail['alerts'];
}

/**
 * 블록 알림 설정 (시안 02-2)
 * 저장 API가 생기기 전이라 화면 안에서만 바뀐다. (⑥ 알림 작업에서 mutation 연결)
 */
export function PaymentAlertCard({ alerts }: PaymentAlertCardProps) {
    const [isShortageOn, setIsShortageOn] = useState(alerts.shortageBeforePay);
    const [isConfirmedOn, setIsConfirmedOn] = useState(alerts.paymentConfirmed);

    return (
        <Card className="pb-1">
            <AppText className="mb-2 font-bold text-15">알림</AppText>
            <AlertRow
                title="납부 3일 전까지 모자라면 알려주기"
                description="다른 블록에서 채울지 같이 물어봐요"
                value={isShortageOn}
                onValueChange={setIsShortageOn}
            />
            <AlertRow
                title="납부 확인되면 알려주기"
                value={isConfirmedOn}
                onValueChange={setIsConfirmedOn}
            />
        </Card>
    );
}
