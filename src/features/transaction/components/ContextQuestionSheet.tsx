import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import { withAlpha } from '@/lib/color';
import { formatMonthDayWeekday, formatTime } from '@/lib/format';
import { AppText } from '@/shared/components/ui/AppText';
import { getWaterColor } from '@/shared/components/ui/BlockBeaker';
import { BottomSheet, BottomSheetTextInput } from '@/shared/components/ui/BottomSheet';
import { Button } from '@/shared/components/ui/Button';
import { Icon } from '@/shared/components/ui/Icon';
import { Mascot } from '@/shared/components/ui/Mascot';
import { colors, fontFamily } from '@/styles/tokens';

import { useAnswerQuestionMutation } from '@/features/transaction/api/useAnswerQuestionMutation';
import { RichTextView } from '@/features/transaction/components/RichTextView';
import { useContextAnswerStore } from '@/features/transaction/stores/contextAnswerStore';
import type {
    ContextAnswerOption,
    ContextQuestion,
} from '@/features/transaction/types/transaction';

/** 직접 적기 최대 길이 */
const MAX_FREE_TEXT_LENGTH = 40;

/** 작은 비커 (28 × 34): 블록 색 22% 바탕 위에 물이 찬다. */
function MiniWaterGlass({ block }: { block: ContextAnswerOption['result']['block'] }) {
    const waterColor = getWaterColor(block.color, block.status);
    const rate = Math.min(100, Math.max(0, block.fillRate));

    return (
        <View
            className="h-[34px] w-7 justify-end overflow-hidden rounded-[7px] border"
            style={{
                backgroundColor: withAlpha(waterColor, 0.22),
                borderColor: withAlpha(waterColor, 0.4),
            }}
        >
            <View style={{ height: `${rate}%`, backgroundColor: waterColor }} />
        </View>
    );
}

/** 선택지 두 개씩 한 줄로 묶는다. 한 줄을 다 쓰는 선택지(isWide)는 혼자 한 줄이다. */
function toRows(options: ContextAnswerOption[]) {
    const rows: ContextAnswerOption[][] = [];
    options.forEach((option) => {
        const last = rows[rows.length - 1];
        if (!option.isWide && last && last.length === 1 && !last[0].isWide) {
            last.push(option);
        } else {
            rows.push([option]);
        }
    });
    return rows;
}

interface ContextQuestionSheetProps {
    question: ContextQuestion | null;
    isOpen: boolean;
    onClose: () => void;
}

/** 09-1 에이전트 질문 답변 시트 */
export function ContextQuestionSheet({
    question: latestQuestion,
    isOpen,
    onClose,
}: ContextQuestionSheetProps) {
    const { mutate: answer, isPending, isError, reset } = useAnswerQuestionMutation();
    // 답한 뒤 목록을 다시 받으면 질문이 null이 된다. 시트가 내려가는 동안은 마지막 질문을 계속 그린다.
    const [lastQuestion, setLastQuestion] = useState(latestQuestion);
    if (latestQuestion && latestQuestion !== lastQuestion) {
        setLastQuestion(latestQuestion);
    }
    const question = latestQuestion ?? lastQuestion;
    const selectedCode = useContextAnswerStore((state) => state.selectedCode);
    const freeText = useContextAnswerStore((state) => state.freeText);
    const saveRule = useContextAnswerStore((state) => state.saveRule);
    const handleSelect = useContextAnswerStore((state) => state.select);
    const handleChangeText = useContextAnswerStore((state) => state.changeFreeText);
    const toggleSaveRule = useContextAnswerStore((state) => state.toggleSaveRule);
    const resetAnswer = useContextAnswerStore((state) => state.reset);

    // 화면이 사라지면(로그아웃 등) 고르던 답을 비운다.
    useEffect(() => resetAnswer, [resetAnswer]);

    if (!question) {
        return null;
    }

    // 닫을 때 처음 상태로 되돌려, 다시 열면 새로 고르게 한다.
    const handleClose = () => {
        resetAnswer();
        reset();
        onClose();
    };

    const trimmedText = freeText.trim();
    const effectiveCode =
        selectedCode === undefined ? (question.options[0]?.code ?? null) : selectedCode;
    const selected = question.options.find(({ code }) => code === effectiveCode) ?? null;
    const canSubmit = selected !== null || trimmedText !== '';

    const handleSubmit = () => {
        if (!canSubmit || isPending) return;
        answer(
            {
                questionId: question.questionId,
                optionCode: selected?.code ?? null,
                freeText: selected ? null : trimmedText,
                saveRule: selected?.ruleSuggestion ? saveRule : false,
            },
            { onSuccess: handleClose },
        );
    };

    return (
        <BottomSheet isOpen={isOpen} onClose={handleClose} title="에이전트의 질문" scrollable>
            <View className="flex-row items-start gap-2 pt-1">
                <Mascot className="h-12 w-12" />
                <View className="mt-1 flex-1 gap-1 rounded-16 rounded-tl-[4px] border border-line bg-surface-app px-4 py-3">
                    <RichTextView
                        parts={question.sheetMessage}
                        className="text-15 leading-[22.5px]"
                    />
                    <AppText className="text-12 text-ink-sub">
                        {`${formatMonthDayWeekday(question.occurredAt)} ${formatTime(question.occurredAt)}  ${question.accountLabel}`}
                    </AppText>
                </View>
            </View>

            <View className="mt-4 gap-2">
                {toRows(question.options).map((row) => (
                    <View key={row.map(({ code }) => code).join()} className="flex-row gap-2">
                        {row.map((option) => {
                            const isSelected = option.code === effectiveCode;
                            return (
                                <Pressable
                                    key={option.code}
                                    accessibilityRole="radio"
                                    accessibilityState={{ selected: isSelected }}
                                    onPress={() => handleSelect(option.code)}
                                    className={cn(
                                        'h-12 flex-1 items-center justify-center rounded-12',
                                        isSelected
                                            ? 'border-2 border-primary-700 bg-primary-50'
                                            : 'border border-line bg-white active:bg-surface-neutral',
                                    )}
                                >
                                    <AppText
                                        className={cn('text-15', isSelected && 'text-primary-700')}
                                    >
                                        {option.label}
                                    </AppText>
                                </Pressable>
                            );
                        })}
                    </View>
                ))}
            </View>

            <View className="mt-3 h-[46px] justify-center rounded-12 border border-line bg-surface-app px-4">
                <BottomSheetTextInput
                    accessibilityLabel="직접 적기"
                    value={freeText}
                    onChangeText={handleChangeText}
                    maxLength={MAX_FREE_TEXT_LENGTH}
                    placeholder="직접 적기 (예: 친구 생일 선물)"
                    placeholderTextColor={colors.ink.sub}
                    returnKeyType="done"
                    style={{
                        padding: 0,
                        fontFamily: fontFamily.regular,
                        fontSize: 15,
                        color: colors.ink.DEFAULT,
                        includeFontPadding: false,
                    }}
                />
            </View>
            <AppText className="mt-2 text-12 text-ink-sub">
                적은 내용은 분류에만 쓰고 저장하지 않아요
            </AppText>

            {selected && (
                <View className="mt-4 flex-row items-center gap-3 rounded-12 border border-line px-4 py-3">
                    <MiniWaterGlass block={selected.result.block} />
                    <RichTextView
                        parts={selected.result.message}
                        className="flex-1 text-13 leading-[19.5px]"
                    />
                </View>
            )}

            {selected?.ruleSuggestion && (
                <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: saveRule }}
                    onPress={toggleSaveRule}
                    className="mt-3 flex-row items-start gap-3 rounded-12 bg-primary-50 p-4 pt-3"
                >
                    <View
                        className={cn(
                            'h-5.5 w-5.5 items-center justify-center rounded-8',
                            saveRule ? 'bg-primary-700' : 'border border-line-control bg-white',
                        )}
                    >
                        {saveRule && (
                            <Icon name="check" size={13} color={colors.white} strokeWidth={1.9} />
                        )}
                    </View>
                    <RichTextView
                        parts={selected.ruleSuggestion}
                        className="flex-1 text-13 leading-[19.5px]"
                    />
                </Pressable>
            )}

            {isError && (
                <AppText
                    className="mt-4 text-center text-12 text-danger-text"
                    accessibilityLiveRegion="polite"
                >
                    답을 보내지 못했어요. 잠시 후 다시 시도해 주세요
                </AppText>
            )}
            <Button
                title={selected?.buttonTitle ?? '답하기'}
                loadingTitle="보내는 중"
                disabled={!canSubmit}
                isLoading={isPending}
                onPress={handleSubmit}
                className={isError ? 'mt-3' : 'mt-8'}
            />
        </BottomSheet>
    );
}
