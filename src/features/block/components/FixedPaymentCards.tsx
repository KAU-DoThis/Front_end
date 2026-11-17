import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import { AppText } from '@/shared/components/ui/AppText';
import { Card } from '@/shared/components/ui/Card';
import { Toggle } from '@/shared/components/ui/Toggle';

import { useUpdateBlockMutation } from '@/features/block/api/useUpdateBlockMutation';
import type { FixedBlockDetail } from '@/features/block/types/blockDetail';

interface RuleRowProps {
    label: string;
    /** 값이 없으면 '-' */
    value: string | null;
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
            <AppText className="font-semibold text-15">{value ?? '-'}</AppText>
        </View>
    );
}

interface PaymentRuleCardProps {
    rule: NonNullable<FixedBlockDetail['matchRule']>;
    /** 고치기 → 블록 수정 시트 (납부 확인 조건은 시안이 없어 납부일·납부액만 고친다) */
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
    blockId: number;
    alerts: FixedBlockDetail['alerts'];
}

type AlertKey = keyof FixedBlockDetail['alerts'];

/**
 * 블록 알림 설정 (시안 02-2). 바꾸면 rule.alerts에 바로 저장한다.
 * 누르면 먼저 화면을 바꾸고(낙관적 업데이트), 저장에 실패하면 되돌린다.
 */
export function PaymentAlertCard({ blockId, alerts }: PaymentAlertCardProps) {
    const [values, setValues] = useState(alerts);
    const { mutateAsync: update } = useUpdateBlockMutation();

    const toggle = (key: AlertKey, value: boolean) => {
        setValues((prev) => ({ ...prev, [key]: value }));
        // alerts는 서버가 키별로 합치므로 version 없이 보낸다. (다른 수정과 부딪히지 않는다)
        // mutate 콜백은 마지막 호출만 불려서, 연달아 눌러도 각각 되돌릴 수 있게 promise로 받는다.
        update({ blockId, patch: { alerts: { [key]: value } } }).catch(() => {
            setValues((prev) => ({ ...prev, [key]: !value }));
            Alert.alert('알림 설정을 바꾸지 못했어요', '잠시 후 다시 시도해 주세요.');
        });
    };

    return (
        <Card className="pb-1">
            <AppText className="mb-2 font-bold text-15">알림</AppText>
            <AlertRow
                title="납부 3일 전까지 모자라면 알려주기"
                description="다른 블록에서 채울지 같이 물어봐요"
                value={values.shortageBeforePay}
                onValueChange={(value) => toggle('shortageBeforePay', value)}
            />
            <AlertRow
                title="납부 확인되면 알려주기"
                value={values.paymentConfirmed}
                onValueChange={(value) => toggle('paymentConfirmed', value)}
            />
        </Card>
    );
}
