import { useState } from 'react';
import { View } from 'react-native';

import { AmountInput } from '@/shared/components/ui/AmountInput';
import { AppText } from '@/shared/components/ui/AppText';
import type { BlockColor } from '@/shared/components/ui/BlockBeaker';
import { BottomSheet } from '@/shared/components/ui/BottomSheet';
import { Button } from '@/shared/components/ui/Button';
import { SegmentedControl } from '@/shared/components/ui/SegmentedControl';
import { ApiError } from '@/shared/types/api';

import { toBlockCreateRequest } from '@/features/block/api/blockCreateMapper';
import { useCreateBlockMutation } from '@/features/block/api/useCreateBlockMutation';
import type { BlockType } from '@/features/block/types/block';
import {
    firstSelectableDay,
    formatFullDate,
    lastDayOfMonth,
} from '@/features/block/utils/blockDate';
import {
    BLOCK_TYPE_LABEL,
    BLOCK_TYPES,
    formatPayDay,
    formatSpendingPeriod,
} from '@/features/block/utils/blockSetupText';

import { DayPickerSheet } from './DayPickerSheet';
import { MonthPickerSheet } from './MonthPickerSheet';
import { ColorField, NameField, SelectField } from './SetupBlockFields';

/** 기간 시작일·납부일은 모든 달에 있는 날(28일)까지 + 말일 버튼으로 고른다. (04 블록 구성과 같음) */
const MAX_PICKABLE_DAY = 28;

/** 색을 안 고르면 유형별 기본색 (서버 BlockColor.defaultFor와 같음) */
const DEFAULT_COLOR: Record<BlockType, BlockColor> = { SPENDING: 'i', GOAL: 'o', FIXED: 'l' };

const AMOUNT_LABEL: Record<BlockType, string> = {
    SPENDING: '한 달 금액',
    GOAL: '목표 금액',
    FIXED: '납부 금액',
};

const NAME_PLACEHOLDER: Record<BlockType, string> = {
    SPENDING: '예: 교통비',
    GOAL: '예: 저축',
    FIXED: '예: 여행',
};

type Picker = 'dueDate' | 'dueDay' | 'day' | null;

interface AddBlockSheetProps {
    isOpen: boolean;
    onClose: () => void;
    /** 열 때마다 바꿔 주면 입력값이 빈 칸에서 새로 시작한다. */
    formKey: number;
}

/**
 * 홈 '블록 추가' (시안 없음: 블록 수정 시트와 같은 입력 칸)
 * 잔액 0원으로 만들고, 돈은 나눌 돈이나 다른 블록에서 채운다.
 */
export function AddBlockSheet({ isOpen, onClose, formKey }: AddBlockSheetProps) {
    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="블록 추가" scrollable>
            <AddBlockForm key={formKey} onDone={onClose} />
        </BottomSheet>
    );
}

interface FormValues {
    type: BlockType;
    name: string;
    color: BlockColor;
    /** 사용형 한 달 금액 · 목표형 목표 금액 · 고정지출형 납부액 */
    amount: number | null;
    /** 사용형 기간 시작일 · 고정지출형 납부일 */
    day: number | null;
    /** 목표형 기한 (yyyy-MM-dd) */
    dueDate: string | null;
}

const INITIAL_VALUES: FormValues = {
    type: 'SPENDING',
    name: '',
    color: DEFAULT_COLOR.SPENDING,
    amount: null,
    day: 1,
    dueDate: null,
};

function getErrors(values: FormValues) {
    return {
        name: values.name.trim() === '' ? '블록 이름을 넣어주세요' : undefined,
        amount: (values.amount ?? 0) <= 0 ? '0원보다 큰 금액을 넣어주세요' : undefined,
        dueDate: values.type === 'GOAL' && !values.dueDate ? '기한을 골라주세요' : undefined,
        day: values.type === 'FIXED' && values.day === null ? '납부일을 골라주세요' : undefined,
    };
}

interface AddBlockFormProps {
    onDone: () => void;
}

function AddBlockForm({ onDone }: AddBlockFormProps) {
    const [values, setValues] = useState(INITIAL_VALUES);
    const [isColorPicked, setIsColorPicked] = useState(false);
    const [openPicker, setOpenPicker] = useState<Picker>(null);
    const [isErrorVisible, setIsErrorVisible] = useState(false);
    const { mutate: create, isPending, error } = useCreateBlockMutation();

    const change = (next: Partial<FormValues>) => setValues((prev) => ({ ...prev, ...next }));
    const errors = getErrors(values);
    const visibleErrors: Partial<typeof errors> = isErrorVisible ? errors : {};
    const hasError = Object.values(errors).some(Boolean);
    const errorMessage = error
        ? error instanceof ApiError
            ? error.message
            : '블록을 만들지 못했어요. 잠시 후 다시 시도해 주세요'
        : null;

    const handleChangeType = (type: BlockType) => {
        if (type === values.type) return;
        // 유형마다 날짜 칸 뜻이 달라 비운다. 이름·금액은 그대로 둔다.
        change({
            type,
            day: type === 'SPENDING' ? 1 : null,
            dueDate: null,
            color: isColorPicked ? values.color : DEFAULT_COLOR[type],
        });
    };

    const handleCreate = () => {
        setIsErrorVisible(true);
        if (isPending || hasError || values.amount === null) return;
        create(toBlockCreateRequest({ ...values, amount: values.amount }), { onSuccess: onDone });
    };

    return (
        <View className="gap-3">
            <SegmentedControl
                size="md"
                options={BLOCK_TYPES.map((type) => ({
                    value: type,
                    label: BLOCK_TYPE_LABEL[type],
                }))}
                value={values.type}
                onChange={handleChangeType}
            />

            <NameField
                value={values.name}
                placeholder={NAME_PLACEHOLDER[values.type]}
                errorMessage={visibleErrors.name}
                onChange={(name) => change({ name })}
                inSheet
            />

            {/* 유형을 바꿔도 시트 높이가 그대로이도록 모든 유형을 금액 한 줄 + 고르기 한 줄로 둔다. */}
            <AmountInput
                label={AMOUNT_LABEL[values.type]}
                value={values.amount}
                onChangeValue={(amount) => change({ amount })}
                errorMessage={visibleErrors.amount}
                inSheet
            />

            {values.type === 'FIXED' && (
                <SelectField
                    label="납부일"
                    value={values.day === null ? null : formatPayDay(values.day)}
                    placeholder="날짜 고르기"
                    errorMessage={visibleErrors.day}
                    onPress={() => setOpenPicker('day')}
                />
            )}

            {values.type === 'SPENDING' && (
                <SelectField
                    label="기간"
                    value={values.day === null ? null : formatSpendingPeriod(values.day)}
                    placeholder="기간 고르기"
                    onPress={() => setOpenPicker('day')}
                />
            )}

            {values.type === 'GOAL' && (
                <SelectField
                    label="기한"
                    value={values.dueDate ? `${formatFullDate(values.dueDate)}까지` : null}
                    placeholder="언제까지 모을지 고르기"
                    errorMessage={visibleErrors.dueDate}
                    onPress={() => setOpenPicker('dueDate')}
                />
            )}

            <ColorField
                value={values.color}
                onChange={(color) => {
                    setIsColorPicked(true);
                    change({ color });
                }}
            />

            <AppText className="text-12 text-ink-sub">
                0원으로 만들어져요. 나눌 돈이나 다른 블록에서 채울 수 있어요
            </AppText>

            {errorMessage && (
                <AppText className="text-12 text-danger-text" accessibilityLiveRegion="polite">
                    {errorMessage}
                </AppText>
            )}
            <Button
                className="mt-1"
                title="만들기"
                loadingTitle="만드는 중"
                isLoading={isPending}
                disabled={isPending}
                onPress={handleCreate}
            />

            {/* 달을 고르면 그달 말일로 두고 일 고르기를 이어서 띄운다. (블록 수정 시트와 같음) */}
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
                title={values.type === 'FIXED' ? '납부일' : '매월 며칠부터 쓸까요?'}
                maxDay={MAX_PICKABLE_DAY}
                hasLastDay
                value={values.day}
                onSelect={(day) => change({ day })}
            />
        </View>
    );
}
