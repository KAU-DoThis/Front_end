import { Image, Pressable, View } from 'react-native';

import type { AgreementType } from '@/features/auth/types/auth';
import { cn } from '@/lib/cn';
import { AppText } from '@/shared/components/ui/AppText';

const CHECK_ICON = require('@/assets/icons/auth-check.png');
const CHEVRON_ICON = require('@/assets/icons/auth-chevron.png');

interface AgreementItem {
    type: AgreementType;
    label: string;
    isRequired: boolean;
    /** 약관 아래 작은 설명 */
    description?: string;
    /** 본문 보기 화살표를 보여줄지 */
    hasDetail: boolean;
}

/** 화면에 보여줄 약관 순서. 요청에도 이 순서대로 담는다. */
export const AGREEMENT_ITEMS: AgreementItem[] = [
    { type: 'TERMS_OF_SERVICE', label: '서비스 이용약관', isRequired: true, hasDetail: true },
    { type: 'PRIVACY_POLICY', label: '개인정보 수집·이용', isRequired: true, hasDetail: true },
    {
        type: 'FINANCIAL_INFO_INQUIRY',
        label: '금융거래정보 조회',
        description: 'CODEF를 통해 연동한 계좌·카드의 잔액과 거래 내역만 조회해요',
        isRequired: true,
        hasDetail: true,
    },
    { type: 'AGE_OVER_14', label: '만 14세 이상이에요', isRequired: true, hasDetail: false },
    { type: 'MARKETING', label: '혜택·소식 알림 받기', isRequired: false, hasDetail: true },
];

export type AgreementState = Record<AgreementType, boolean>;

export const INITIAL_AGREEMENT_STATE: AgreementState = {
    TERMS_OF_SERVICE: false,
    PRIVACY_POLICY: false,
    FINANCIAL_INFO_INQUIRY: false,
    AGE_OVER_14: false,
    MARKETING: false,
};

interface CheckBoxProps {
    isChecked: boolean;
    size: 'md' | 'lg';
}

// 둥근 사각 체크박스 (전체 동의 24 · 약관 22). 체크하면 청록 면 + 흰 체크
function CheckBox({ isChecked, size }: CheckBoxProps) {
    return (
        <View
            className={cn(
                'items-center justify-center rounded-8',
                size === 'lg' ? 'h-6 w-6' : 'h-5.5 w-5.5',
                isChecked ? 'bg-primary-700' : 'border border-line-control bg-white',
            )}
        >
            {isChecked && <Image source={CHECK_ICON} className="h-3.25 w-3.25" />}
        </View>
    );
}

interface AgreementRowProps {
    item: AgreementItem;
    isChecked: boolean;
    disabled: boolean;
    onToggle: () => void;
    /** 없으면 본문 보기 화살표를 숨긴다. */
    onPressDetail?: () => void;
}

// 줄을 누르면 체크, 오른쪽 화살표를 누르면 본문 보기
function AgreementRow({ item, isChecked, disabled, onToggle, onPressDetail }: AgreementRowProps) {
    const tag = item.isRequired ? '필수' : '선택';

    return (
        <View className="flex-row items-start">
            <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isChecked, disabled }}
                accessibilityLabel={`${tag} ${item.label}`}
                accessibilityHint={item.description}
                className="flex-1 flex-row items-start gap-3 py-2.5"
                disabled={disabled}
                onPress={onToggle}
            >
                <CheckBox isChecked={isChecked} size="md" />
                <View className="flex-1 gap-1 pr-4">
                    <AppText className="text-15">
                        <AppText
                            className={cn(
                                'text-13',
                                item.isRequired ? 'font-bold' : 'text-ink-sub',
                            )}
                        >
                            {tag}
                        </AppText>
                        {` ${item.label}`}
                    </AppText>
                    {item.description && (
                        <AppText className="text-12 text-ink-sub">{item.description}</AppText>
                    )}
                </View>
            </Pressable>
            {item.hasDetail && onPressDetail && (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${item.label} 보기`}
                    className="mt-2.5"
                    // 18px 아이콘의 터치 영역을 44px로 맞춘다.
                    hitSlop={13}
                    onPress={onPressDetail}
                >
                    <Image source={CHEVRON_ICON} className="h-4.5 w-4.5" />
                </Pressable>
            )}
        </View>
    );
}

interface AgreementListProps {
    value: AgreementState;
    onChange: (value: AgreementState) => void;
    /** 없으면 본문 보기 화살표를 모두 숨긴다. (약관 본문이 준비되기 전) */
    onPressDetail?: (type: AgreementType) => void;
    /** 가입 요청 중·가입 후에는 선택을 바꾸지 못하게 한다. */
    disabled?: boolean;
}

/** 전체 동의 + 약관별 동의 */
export function AgreementList({
    value,
    onChange,
    onPressDetail,
    disabled = false,
}: AgreementListProps) {
    const isAllChecked = AGREEMENT_ITEMS.every(({ type }) => value[type]);

    const handleToggleAll = () => {
        const next = !isAllChecked;
        onChange(
            Object.fromEntries(AGREEMENT_ITEMS.map(({ type }) => [type, next])) as AgreementState,
        );
    };

    return (
        <View className="gap-6">
            <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isAllChecked, disabled }}
                accessibilityLabel="전체 동의"
                className="flex-row items-center gap-3 rounded-16 border border-line-control px-4 py-5"
                disabled={disabled}
                onPress={handleToggleAll}
            >
                <CheckBox isChecked={isAllChecked} size="lg" />
                <AppText className="font-bold text-17">전체 동의</AppText>
            </Pressable>
            <View className="gap-1 px-4">
                {AGREEMENT_ITEMS.map((item) => (
                    <AgreementRow
                        key={item.type}
                        item={item}
                        isChecked={value[item.type]}
                        disabled={disabled}
                        onToggle={() => onChange({ ...value, [item.type]: !value[item.type] })}
                        onPressDetail={onPressDetail && (() => onPressDetail(item.type))}
                    />
                ))}
            </View>
        </View>
    );
}
