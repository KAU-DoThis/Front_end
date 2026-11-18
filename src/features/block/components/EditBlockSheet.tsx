import { useState } from 'react';
import { Alert, View } from 'react-native';

import { AmountInput } from '@/shared/components/ui/AmountInput';
import { AppText } from '@/shared/components/ui/AppText';
import type { BlockColor } from '@/shared/components/ui/BlockBeaker';
import { BottomSheet } from '@/shared/components/ui/BottomSheet';
import { Button } from '@/shared/components/ui/Button';
import { ApiError } from '@/shared/types/api';

import { useUpdateBlockMutation } from '@/features/block/api/useUpdateBlockMutation';
import type { BlockDetail } from '@/features/block/types/blockDetail';
import type { BlockPatch } from '@/features/block/types/blockUpdate';
import {
    firstSelectableDay,
    formatFullDate,
    lastDayOfMonth,
} from '@/features/block/utils/blockDate';
import { formatPayDay, formatSpendingPeriod } from '@/features/block/utils/blockSetupText';

import { DayPickerSheet } from './DayPickerSheet';
import { MonthPickerSheet } from './MonthPickerSheet';
import { ColorField, NameField, SelectField } from './SetupBlockFields';

/** 기간 시작일·납부일은 모든 달에 있는 날(28일)까지 + 말일 버튼으로 고른다. (04 블록 구성과 같음) */
const MAX_PICKABLE_DAY = 28;

/** 열자마자 띄울 고르기 시트 ('목표일 미루기' → 기한). dueDay는 기한 달을 고른 뒤 이어서 뜨는 일 고르기 */
export type EditBlockPicker = 'dueDate' | 'dueDay' | 'day' | null;

interface EditBlockSheetProps {
    isOpen: boolean;
    onClose: () => void;
    detail: BlockDetail;
    /** 열 때마다 바꿔 주면 입력값이 지금 블록 값에서 새로 시작한다. */
    formKey: number;
    initialPicker?: EditBlockPicker;
}

/**
 * 블록 상세 '⋯' → 블록 수정 (시안 없음: 04 블록 구성 입력 칸 재사용)
 * 공통 이름·색, 사용형 월 배분액·기간 시작일, 목표형 목표 금액·기한, 고정지출형 납부액·납부일
 */
export function EditBlockSheet({
    isOpen,
    onClose,
    detail,
    formKey,
    initialPicker = null,
}: EditBlockSheetProps) {
    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="블록 수정" scrollable>
            <EditBlockForm
                key={formKey}
                detail={detail}
                initialPicker={initialPicker}
                onDone={onClose}
            />
        </BottomSheet>
    );
}

/** 유형마다 금액·날짜 칸이 가리키는 값이 다르다. (amount: 월 배분액·목표 금액·납부액, day: 시작일·납부일) */
interface FormValues {
    name: string;
    color: BlockColor;
    amount: number | null;
    day: number | null;
    dueDate: string | null;
}

function toFormValues(detail: BlockDetail): FormValues {
    const { block } = detail;
    const base = { name: block.name, color: block.color, dueDate: block.dueDate };
    switch (detail.type) {
        case 'SPENDING':
            return { ...base, amount: detail.monthlyAmount, day: detail.startDay };
        case 'GOAL':
            return { ...base, amount: detail.targetAmount, day: null };
        case 'FIXED':
            return { ...base, amount: detail.payAmount, day: block.rule?.pay_day ?? null };
    }
}

/** 처음 값과 달라진 칸만 보낸다. */
function toPatch(type: BlockDetail['type'], initial: FormValues, values: FormValues): BlockPatch {
    const patch: BlockPatch = {};
    const name = values.name.trim();
    if (name !== initial.name) patch.name = name;
    if (values.color !== initial.color) patch.color = values.color;
    const amount = values.amount !== initial.amount ? (values.amount ?? undefined) : undefined;
    const day = values.day !== initial.day ? (values.day ?? undefined) : undefined;
    switch (type) {
        case 'SPENDING':
            return { ...patch, monthlyAmount: amount, startDay: day };
        case 'GOAL':
            return {
                ...patch,
                targetAmount: amount,
                dueDate:
                    values.dueDate !== initial.dueDate ? (values.dueDate ?? undefined) : undefined,
            };
        case 'FIXED':
            return { ...patch, payAmount: amount, payDay: day };
    }
}

const hasChanges = (patch: BlockPatch) => Object.values(patch).some((value) => value !== undefined);

const isDirty = (initial: FormValues, values: FormValues) =>
    (Object.keys(initial) as (keyof FormValues)[]).some((key) => initial[key] !== values[key]);

interface EditBlockFormProps {
    detail: BlockDetail;
    initialPicker: EditBlockPicker;
    onDone: () => void;
}

function EditBlockForm({ detail, initialPicker, onDone }: EditBlockFormProps) {
    const [initial] = useState(() => toFormValues(detail));
    // 연 시점의 version으로 저장해야, 여는 사이 다른 곳에서 바뀐 경우 409로 막힌다.
    const [initialVersion] = useState(detail.version);
    const [values, setValues] = useState(initial);
    const [openPicker, setOpenPicker] = useState<EditBlockPicker>(initialPicker);
    const [isErrorVisible, setIsErrorVisible] = useState(false);
    const { mutate: update, isPending, error, reset } = useUpdateBlockMutation();

    const change = (next: Partial<FormValues>) => {
        // 값을 고치면 지난 저장 오류 문구는 지운다.
        if (error) reset();
        setValues((prev) => ({ ...prev, ...next }));
    };
    const patch = toPatch(detail.type, initial, values);
    const errors = {
        name: values.name.trim() === '' ? '블록 이름을 넣어주세요' : undefined,
        // 고친 금액만 본다. (지우면 보낼 값이 없어서 오류)
        amount:
            values.amount !== initial.amount && (values.amount ?? 0) <= 0
                ? '0원보다 큰 금액을 넣어주세요'
                : undefined,
    };
    const visibleErrors: Partial<typeof errors> = isErrorVisible ? errors : {};
    const isConflict = error instanceof ApiError && error.code === 'BLOCK_VERSION_CONFLICT';
    const errorMessage =
        error && !isConflict
            ? error instanceof ApiError
                ? error.message
                : '블록을 고치지 못했어요. 잠시 후 다시 시도해 주세요'
            : null;

    const handleSave = () => {
        setIsErrorVisible(true);
        if (isPending || errors.name || errors.amount) return;
        // 이름 앞뒤 공백만 바꾼 경우처럼 보낼 게 없으면 그냥 닫는다.
        if (!hasChanges(patch)) {
            onDone();
            return;
        }
        update(
            { blockId: detail.block.blockId, patch, version: initialVersion },
            {
                onSuccess: onDone,
                onError: (saveError) => {
                    if (
                        saveError instanceof ApiError &&
                        saveError.code === 'BLOCK_VERSION_CONFLICT'
                    ) {
                        // 상세는 mutation이 다시 불러온다. 시트를 닫아 다음에 새 값으로 열리게 한다.
                        Alert.alert(
                            '다른 곳에서 바뀌었어요',
                            '새로 불러온 내용으로 다시 고쳐 주세요.',
                        );
                        onDone();
                    }
                },
            },
        );
    };

    const amountInput = (label: string, size: 'md' | 'sm' = 'md') => (
        <AmountInput
            className={size === 'sm' ? 'flex-1' : undefined}
            size={size}
            label={label}
            value={values.amount}
            onChangeValue={(amount) => change({ amount })}
            errorMessage={visibleErrors.amount}
            inSheet
        />
    );

    return (
        <View className="gap-3">
            <NameField
                value={values.name}
                errorMessage={visibleErrors.name}
                onChange={(name) => change({ name })}
                inSheet
            />

            {detail.type === 'SPENDING' && (
                <>
                    {amountInput('한 달 금액')}
                    <SelectField
                        label="기간"
                        value={values.day === null ? null : formatSpendingPeriod(values.day)}
                        placeholder="기간 고르기"
                        onPress={() => setOpenPicker('day')}
                    />
                </>
            )}

            {detail.type === 'GOAL' && (
                <>
                    {amountInput('목표 금액')}
                    <SelectField
                        label="기한"
                        value={values.dueDate ? `${formatFullDate(values.dueDate)}까지` : null}
                        placeholder="언제까지 모을지 고르기"
                        onPress={() => setOpenPicker('dueDate')}
                    />
                </>
            )}

            {/* 납부 확인 조건은 고치는 시안이 없어 이 시트에서 빼 둔다. */}
            {detail.type === 'FIXED' && (
                <View className="flex-row items-start gap-2">
                    {amountInput('납부 금액', 'sm')}
                    <SelectField
                        className="flex-1"
                        label="납부일"
                        value={values.day === null ? null : formatPayDay(values.day)}
                        placeholder="날짜 고르기"
                        onPress={() => setOpenPicker('day')}
                    />
                </View>
            )}
            {/* 예전에 29·30일로 정한 블록만 해당. 서버는 그달에 없는 납부일이면 말일로 본다. */}
            {detail.type === 'FIXED' &&
                values.day !== null &&
                values.day >= 29 &&
                values.day < 31 && (
                    <AppText className="-mt-1 text-12 text-ink-sub">없는 달은 말일에 내요</AppText>
                )}

            <ColorField value={values.color} onChange={(color) => change({ color })} />

            {errorMessage && (
                <AppText className="text-12 text-danger-text" accessibilityLiveRegion="polite">
                    {errorMessage}
                </AppText>
            )}
            <Button
                className="mt-1"
                title="저장"
                loadingTitle="저장 중"
                isLoading={isPending}
                disabled={!isDirty(initial, values) || isPending}
                onPress={handleSave}
            />

            {/* 달을 고르면 그달 말일로 두고 일 고르기를 이어서 띄운다. 일을 안 고르고 닫으면 말일로 남는다. */}
            <MonthPickerSheet
                isOpen={openPicker === 'dueDate'}
                // 고르면 onSelect가 dueDay로 넘긴 뒤 onClose가 불리므로, 그때는 닫지 않는다.
                onClose={() => setOpenPicker((picker) => (picker === 'dueDate' ? null : picker))}
                title="언제까지 모을까요?"
                value={values.dueDate}
                onSelect={(dueDate) => {
                    change({ dueDate });
                    setOpenPicker('dueDay');
                }}
            />
            {values.dueDate && (
                <DayPickerSheet
                    isOpen={openPicker === 'dueDay'}
                    onClose={() => setOpenPicker(null)}
                    title={`${values.dueDate.slice(0, 4)}년 ${Number(values.dueDate.slice(5, 7))}월 며칠까지 모을까요?`}
                    maxDay={lastDayOfMonth(values.dueDate)}
                    minDay={firstSelectableDay(values.dueDate)}
                    value={Number(values.dueDate.slice(8, 10))}
                    onSelect={(day) =>
                        change({
                            dueDate: `${values.dueDate?.slice(0, 8)}${String(day).padStart(2, '0')}`,
                        })
                    }
                />
            )}
            <DayPickerSheet
                isOpen={openPicker === 'day'}
                onClose={() => setOpenPicker(null)}
                title={detail.type === 'FIXED' ? '납부일' : '매월 며칠부터 쓸까요?'}
                maxDay={MAX_PICKABLE_DAY}
                hasLastDay
                value={values.day}
                onSelect={(day) => change({ day })}
            />
        </View>
    );
}
