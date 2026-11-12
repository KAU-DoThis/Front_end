import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import type { SetupBlock } from '@/features/block/types/blockSetup';
import {
    BLOCK_COLOR_BG_CLASS,
    BLOCK_COLOR_LABEL,
    BLOCK_COLORS,
    formatSpendingPeriod,
} from '@/features/block/utils/blockSetupText';
import { cn } from '@/lib/cn';
import { formatAmount } from '@/lib/format';
import { AmountInput } from '@/shared/components/ui/AmountInput';
import { AppText } from '@/shared/components/ui/AppText';
import { Icon } from '@/shared/components/ui/Icon';
import { Toggle } from '@/shared/components/ui/Toggle';
import { colors } from '@/styles/tokens';

import { DayPickerSheet } from './DayPickerSheet';
import { MonthPickerSheet, formatYearMonth } from './MonthPickerSheet';

/** − / + 한 번에 바뀌는 금액 */
const AMOUNT_STEP = 10_000;
/** 기간 시작일은 모든 달에 있는 날(28일)까지만 고른다. */
const MAX_PERIOD_START_DAY = 28;

export interface SetupBlockErrors {
    name?: string;
    amount?: string;
    targetAmount?: string;
    dueDate?: string;
    payDay?: string;
}

/** 확정 전에 채워야 하는 값 확인. 문구는 디자인 시스템 '입력칸 · 오류' 기준 */
export function getSetupBlockErrors(block: SetupBlock): SetupBlockErrors {
    const errors: SetupBlockErrors = {};
    if (block.name.trim() === '') {
        errors.name = '블록 이름을 넣어주세요';
    }
    if (block.amount === null || block.amount <= 0) {
        errors.amount = '0원보다 큰 금액을 넣어주세요';
    }
    if (block.type === 'GOAL' && (block.targetAmount === null || block.targetAmount <= 0)) {
        errors.targetAmount = '0원보다 큰 금액을 넣어주세요';
    }
    if (block.type === 'GOAL' && block.dueDate === null) {
        errors.dueDate = '기한을 골라주세요';
    }
    if (block.type === 'FIXED' && block.payDay === null) {
        errors.payDay = '납부일을 골라주세요';
    }
    return errors;
}

type BlockPatch = Partial<Omit<SetupBlock, 'key'>>;

interface FieldLabelProps {
    children: string;
}

function FieldLabel({ children }: FieldLabelProps) {
    return <AppText className="text-12 text-ink-sub">{children}</AppText>;
}

interface SelectFieldProps {
    label: string;
    value: string | null;
    placeholder: string;
    errorMessage?: string;
    onPress: () => void;
    className?: string;
}

/** 눌러서 시트로 고르는 칸 (44 · 12, 오른쪽 아래 화살표) */
function SelectField({
    label,
    value,
    placeholder,
    errorMessage,
    onPress,
    className,
}: SelectFieldProps) {
    return (
        <View className={cn('gap-2', className)}>
            <FieldLabel>{label}</FieldLabel>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${label} ${value ?? placeholder}`}
                accessibilityHint="눌러서 바꿀 수 있어요"
                onPress={onPress}
                className={cn(
                    'h-11 flex-row items-center rounded-12 bg-white px-3 active:bg-surface-neutral',
                    errorMessage ? 'border-2 border-danger-text' : 'border border-line',
                )}
            >
                <AppText
                    numberOfLines={1}
                    className={cn('flex-1 text-15', value ? 'font-semibold' : 'text-ink-disabled')}
                >
                    {value ?? placeholder}
                </AppText>
                <Icon name="chevron-down" size={18} color={colors.ink.sub} strokeWidth={1.5} />
            </Pressable>
            {errorMessage && (
                <AppText className="text-12 text-danger-text" accessibilityLiveRegion="polite">
                    {errorMessage}
                </AppText>
            )}
        </View>
    );
}

interface NameFieldProps {
    value: string;
    errorMessage?: string;
    onChange: (value: string) => void;
}

/** 블록 이름 칸 (금액 칸과 같은 상태 규칙). AI가 제안한 블록도 이름을 바꿀 수 있다. */
function NameField({ value, errorMessage, onChange }: NameFieldProps) {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View className="gap-2">
            <FieldLabel>블록 이름</FieldLabel>
            <TextInput
                className={cn(
                    'h-11 rounded-12 bg-white px-3 font-regular text-15 text-ink',
                    errorMessage
                        ? 'border-2 border-danger-text'
                        : isFocused
                          ? 'border-2 border-primary-700'
                          : 'border border-line-control',
                )}
                value={value}
                onChangeText={onChange}
                placeholder="예: 저축"
                placeholderTextColor={colors.ink.disabled}
                maxLength={20}
                accessibilityLabel="블록 이름"
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
            />
            {errorMessage && (
                <AppText className="text-12 text-danger-text" accessibilityLiveRegion="polite">
                    {errorMessage}
                </AppText>
            )}
        </View>
    );
}

interface StepButtonProps {
    label: '−' | '+';
    accessibilityLabel: string;
    onPress: () => void;
}

function StepButton({ label, accessibilityLabel, onPress }: StepButtonProps) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            onPress={onPress}
            className="h-11 w-11 items-center justify-center rounded-12 border border-line-control bg-white active:bg-surface-chip"
        >
            <AppText className="text-20">{label}</AppText>
        </Pressable>
    );
}

interface ColorFieldProps {
    value: SetupBlock['color'];
    onChange: (value: SetupBlock['color']) => void;
}

function ColorField({ value, onChange }: ColorFieldProps) {
    return (
        <View className="gap-2">
            <FieldLabel>색상</FieldLabel>
            <View className="flex-row gap-2" accessibilityRole="radiogroup">
                {BLOCK_COLORS.map((color) => {
                    const isSelected = color === value;
                    return (
                        <Pressable
                            key={color}
                            accessibilityRole="radio"
                            accessibilityLabel={BLOCK_COLOR_LABEL[color]}
                            accessibilityState={{ selected: isSelected }}
                            // 32px 칸의 터치 영역을 44px로 맞춘다.
                            hitSlop={6}
                            onPress={() => onChange(color)}
                            className={cn(
                                'h-8 w-8 rounded-8',
                                BLOCK_COLOR_BG_CLASS[color],
                                isSelected && 'border-2 border-ink',
                            )}
                        />
                    );
                })}
            </View>
        </View>
    );
}

interface CautionBoxProps {
    message: string;
}

/** 연한 주의 표시 (시안 04 생활비 소진 주의) */
function CautionBox({ message }: CautionBoxProps) {
    return (
        <View
            className="flex-row gap-2 rounded-12 bg-caution-soft-bg p-3"
            accessibilityLiveRegion="polite"
        >
            <View className="mt-px h-4.5 w-4.5 items-center justify-center rounded-full bg-caution-soft-text">
                <AppText className="font-bold text-12 text-caution-soft-bg">!</AppText>
            </View>
            <AppText className="flex-1 text-13 text-caution-body">{message}</AppText>
        </View>
    );
}

interface SetupBlockFieldsProps {
    block: SetupBlock;
    errors: SetupBlockErrors;
    /** 오류는 한 번 확정을 눌렀거나 칸을 건드린 뒤에만 보여준다. */
    isErrorVisible: boolean;
    /** AI가 처음 제안한 금액 (직접 추가한 블록은 null) */
    suggestedAmount: number | null;
    /** 서버가 계산한 사용형 하루 쓸 돈 */
    dailyBudget: number | null;
    /** 서버가 보낸 주의 문장 */
    warning: string | null;
    onChange: (patch: BlockPatch) => void;
}

type OpenSheet = 'payDay' | 'periodStartDay' | 'dueDate' | null;

/** 펼친 블록 카드의 유형별 입력 칸 (시안 04 월세 · 생활비) */
export function SetupBlockFields({
    block,
    errors,
    isErrorVisible,
    suggestedAmount,
    dailyBudget,
    warning,
    onChange,
}: SetupBlockFieldsProps) {
    const [openSheet, setOpenSheet] = useState<OpenSheet>(null);
    const visibleErrors = isErrorVisible ? errors : {};

    const changeAmountBy = (delta: number) =>
        onChange({ amount: Math.max(0, (block.amount ?? 0) + delta) });

    return (
        <View className="gap-3">
            <NameField
                value={block.name}
                errorMessage={visibleErrors.name}
                onChange={(name) => onChange({ name })}
            />

            {block.type === 'FIXED' && (
                <>
                    <View className="flex-row items-start gap-2">
                        <AmountInput
                            className="flex-1"
                            size="sm"
                            label="납부 금액"
                            value={block.amount}
                            onChangeValue={(amount) => onChange({ amount })}
                            errorMessage={visibleErrors.amount}
                        />
                        <SelectField
                            className="flex-1"
                            label="납부일"
                            value={block.payDay === null ? null : `매월 ${block.payDay}일`}
                            placeholder="날짜 고르기"
                            errorMessage={visibleErrors.payDay}
                            onPress={() => setOpenSheet('payDay')}
                        />
                    </View>
                    <View className="gap-2">
                        <FieldLabel>이 거래가 나가면 납부한 걸로 볼게요</FieldLabel>
                        {/* TODO: 납부 확인 조건 고치기 화면이 시안에 나오면 누를 수 있게 연결한다. */}
                        <View className="h-11 flex-row items-center rounded-12 border border-line px-3">
                            {block.paymentMatch ? (
                                <AppText numberOfLines={1} className="flex-1 text-15">
                                    {'받는 분 '}
                                    <AppText className="font-bold text-15">
                                        {block.paymentMatch.counterparty}
                                    </AppText>
                                    {'  금액 '}
                                    <AppText className="font-bold text-15">
                                        {`${formatAmount(block.paymentMatch.minAmount, { showUnit: false })} ~ ${formatAmount(block.paymentMatch.maxAmount, { showUnit: false })}`}
                                    </AppText>
                                </AppText>
                            ) : (
                                <AppText className="flex-1 text-15 text-ink-disabled">
                                    아직 찾은 거래가 없어요
                                </AppText>
                            )}
                        </View>
                    </View>
                    <View className="flex-row items-center gap-3">
                        <AppText className="flex-1 text-15">
                            납부 3일 전까지 돈이 모자라면 알려주기
                        </AppText>
                        <Toggle
                            value={block.notifyShortage}
                            onValueChange={(notifyShortage) => onChange({ notifyShortage })}
                            accessibilityLabel="납부 3일 전까지 돈이 모자라면 알려주기"
                        />
                    </View>
                    <ColorField value={block.color} onChange={(color) => onChange({ color })} />
                </>
            )}

            {block.type === 'SPENDING' && (
                <>
                    <View className="gap-2">
                        <AmountInput
                            label="한 달 금액"
                            value={block.amount}
                            onChangeValue={(amount) => onChange({ amount })}
                            errorMessage={visibleErrors.amount}
                            leading={
                                <StepButton
                                    label="−"
                                    accessibilityLabel={`${formatAmount(AMOUNT_STEP)} 줄이기`}
                                    onPress={() => changeAmountBy(-AMOUNT_STEP)}
                                />
                            }
                            trailing={
                                <StepButton
                                    label="+"
                                    accessibilityLabel={`${formatAmount(AMOUNT_STEP)} 늘리기`}
                                    onPress={() => changeAmountBy(AMOUNT_STEP)}
                                />
                            }
                        />
                        <View className="flex-row">
                            {suggestedAmount !== null && (
                                <AppText className="text-12 text-ink-sub">
                                    {`AI 제안 ${formatAmount(suggestedAmount, { showUnit: false })}`}
                                </AppText>
                            )}
                            {dailyBudget !== null && (
                                <AppText className="ml-auto text-12 text-ink-sub">
                                    {'하루 약 '}
                                    <AppText className="font-bold text-12">
                                        {formatAmount(dailyBudget)}
                                    </AppText>
                                </AppText>
                            )}
                        </View>
                    </View>
                    {warning && <CautionBox message={warning} />}
                    <SelectField
                        label="기간"
                        value={formatSpendingPeriod(block.periodStartDay ?? 1)}
                        placeholder="기간 고르기"
                        onPress={() => setOpenSheet('periodStartDay')}
                    />
                    <ColorField value={block.color} onChange={(color) => onChange({ color })} />
                </>
            )}

            {/* 목표형 입력은 시안이 없어 목표 금액·기한·한 달 모을 금액·색을 받는다. 기한은 달만 고르고 그달 말일로 보낸다. */}
            {block.type === 'GOAL' && (
                <>
                    <AmountInput
                        label="목표 금액"
                        value={block.targetAmount}
                        onChangeValue={(targetAmount) => onChange({ targetAmount })}
                        errorMessage={visibleErrors.targetAmount}
                    />
                    <SelectField
                        label="기한"
                        value={block.dueDate ? `${formatYearMonth(block.dueDate)}까지` : null}
                        placeholder="언제까지 모을지 고르기"
                        errorMessage={visibleErrors.dueDate}
                        onPress={() => setOpenSheet('dueDate')}
                    />
                    <AmountInput
                        label="한 달 모을 금액"
                        value={block.amount}
                        onChangeValue={(amount) => onChange({ amount })}
                        errorMessage={visibleErrors.amount}
                    />
                    <ColorField value={block.color} onChange={(color) => onChange({ color })} />
                </>
            )}

            <MonthPickerSheet
                isOpen={openSheet === 'dueDate'}
                onClose={() => setOpenSheet(null)}
                title="언제까지 모을까요?"
                value={block.dueDate}
                onSelect={(dueDate) => onChange({ dueDate })}
            />
            <DayPickerSheet
                isOpen={openSheet === 'payDay'}
                onClose={() => setOpenSheet(null)}
                title="납부일"
                maxDay={31}
                value={block.payDay}
                onSelect={(payDay) => onChange({ payDay })}
            />
            <DayPickerSheet
                isOpen={openSheet === 'periodStartDay'}
                onClose={() => setOpenSheet(null)}
                title="매월 며칠부터 쓸까요?"
                maxDay={MAX_PERIOD_START_DAY}
                value={block.periodStartDay}
                onSelect={(periodStartDay) => onChange({ periodStartDay })}
            />
        </View>
    );
}
