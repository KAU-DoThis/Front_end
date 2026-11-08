import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import { formatAmount, formatDayHeader } from '@/lib/format';
import { AppText } from '@/shared/components/ui/AppText';
import { getWaterColor } from '@/shared/components/ui/BlockBeaker';
import { BottomSheet, BottomSheetTextInput } from '@/shared/components/ui/BottomSheet';
import { Button } from '@/shared/components/ui/Button';
import { Icon } from '@/shared/components/ui/Icon';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { colors, fontFamily } from '@/styles/tokens';

import { useCreateQuickInputMutation } from '@/features/transaction/api/useCreateQuickInputMutation';
import { useQuickInputPreviewQuery } from '@/features/transaction/api/useQuickInputPreviewQuery';
import { DateCalendar } from '@/features/transaction/components/DateCalendar';
import {
    useQuickInputStore,
    type PickedValue,
} from '@/features/transaction/stores/quickInputStore';
import type { QuickInputBlock, QuickInputPreview } from '@/features/transaction/types/transaction';

/** 입력칸 아래 예시 (누르면 입력칸에 채운다) */
const EXAMPLES = ['점심 8000', '어제 택시 12000', '월요일 약국 6500'];

/** 입력을 멈추고 이만큼 지나면 서버에 나눠 달라고 한다. */
const PREVIEW_DEBOUNCE_MS = 400;

const MAX_TEXT_LENGTH = 40;

const resolvePicked = <T,>(picked: PickedValue<T> | null, parsed: T) =>
    picked && picked.parsed === parsed ? picked.value : parsed;

interface PreviewRowProps {
    label: string;
    /** 마지막 줄(블록)은 아래 선이 없다. */
    isLast?: boolean;
    /** 있으면 줄을 누를 수 있고 오른쪽에 >를 보여준다. */
    onPress?: () => void;
    /** 누를 수는 없지만 >를 보여준다. (고치는 화면을 정하기 전 자리) */
    hasChevron?: boolean;
    children: ReactNode;
}

/** 저장 미리보기 한 줄: 라벨 · 값 · > */
function PreviewRow({
    label,
    isLast = false,
    onPress,
    hasChevron = !!onPress,
    children,
}: PreviewRowProps) {
    return (
        <Pressable
            accessibilityRole={onPress ? 'button' : undefined}
            accessibilityLabel={onPress ? `${label} 바꾸기` : undefined}
            disabled={!onPress}
            onPress={onPress}
            className={cn(
                'min-h-[43px] flex-row items-center py-3',
                !isLast && 'border-b border-line-soft',
                onPress && 'active:opacity-60',
            )}
        >
            <AppText className="w-[72px] text-13 text-ink-sub">{label}</AppText>
            <View className="flex-1 flex-row items-center gap-2.5">{children}</View>
            {hasChevron && <Icon name="chevron-right" size={14} color={colors.ink.disabled} />}
        </Pressable>
    );
}

/** 블록 색 점 + 이름 */
function BlockName({
    block,
    isSelected = false,
}: {
    block: QuickInputBlock;
    isSelected?: boolean;
}) {
    return (
        <View className="flex-row items-center gap-1.5">
            <View
                className="h-2 w-2 rounded-[3px]"
                style={{ backgroundColor: getWaterColor(block.color, block.status) }}
            />
            <AppText className={cn('font-semibold text-15', isSelected && 'text-primary-700')}>
                {block.name}
            </AppText>
        </View>
    );
}

interface SavePreviewCardProps {
    preview: QuickInputPreview;
    date: string;
    block: QuickInputBlock;
    onPressDate: () => void;
    onPressBlock: () => void;
}

/** 이렇게 저장할게요 (금액 · 내용 · 날짜 · 카테고리 · 블록) */
function SavePreviewCard({
    preview,
    date,
    block,
    onPressDate,
    onPressBlock,
}: SavePreviewCardProps) {
    return (
        <View className="rounded-16 border border-line px-4 pt-4">
            <AppText className="font-bold text-12 text-primary-700">이렇게 저장할게요</AppText>
            <PreviewRow label="금액">
                {preview.amount === null ? (
                    <AppText className="flex-1 text-13 text-danger-text">
                        금액을 숫자로 같이 적어주세요
                    </AppText>
                ) : (
                    <AppText className="font-semibold text-15">
                        {formatAmount(preview.amount)}
                    </AppText>
                )}
            </PreviewRow>
            <PreviewRow label="내용">
                <AppText
                    className={cn(
                        'flex-1 font-semibold text-15',
                        !preview.memo && 'font-regular text-ink-sub',
                    )}
                    numberOfLines={1}
                >
                    {preview.memo ?? '현금 지출'}
                </AppText>
            </PreviewRow>
            <PreviewRow label="날짜" onPress={onPressDate}>
                <AppText className="font-semibold text-15">
                    {formatDayHeader(date, preview.today)}
                </AppText>
            </PreviewRow>
            {/* TODO: 카테고리를 고르는 방식이 정해지면 onPress를 단다. */}
            <PreviewRow label="카테고리" hasChevron>
                <AppText
                    className={cn(
                        'font-semibold text-15',
                        !preview.categoryName && 'font-regular text-ink-sub',
                    )}
                >
                    {preview.categoryName ?? '분류 없음'}
                </AppText>
            </PreviewRow>
            <PreviewRow label="블록" isLast onPress={onPressBlock}>
                <BlockName block={block} />
                {block.isDefault && <AppText className="text-12 text-ink-sub">기본 블록</AppText>}
            </PreviewRow>
        </View>
    );
}

interface BlockPickListProps {
    blocks: QuickInputBlock[];
    selectedId: number;
    onSelect: (block: QuickInputBlock) => void;
}

/** 블록 고르기 (시트 안 한 단계 들어간 화면) */
function BlockPickList({ blocks, selectedId, onSelect }: BlockPickListProps) {
    return (
        <View className="pb-2">
            {blocks.map((block) => {
                const isSelected = block.blockId === selectedId;
                return (
                    <Pressable
                        key={block.blockId}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                        onPress={() => onSelect(block)}
                        className="min-h-[52px] flex-row items-center gap-2.5 border-b border-line-soft active:bg-surface-neutral"
                    >
                        <BlockName block={block} isSelected={isSelected} />
                        <View className="flex-1">
                            {block.isDefault && (
                                <AppText className="text-12 text-ink-sub">기본 블록</AppText>
                            )}
                        </View>
                        {isSelected && <Icon name="check" size={18} color={colors.primary[700]} />}
                    </Pressable>
                );
            })}
        </View>
    );
}

interface QuickInputSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

/** 10 빠른 입력 시트 (F-26): 현금처럼 자동으로 안 잡히는 지출을 한 줄로 적는다. */
export function QuickInputSheet({ isOpen, onClose }: QuickInputSheetProps) {
    const [isFocused, setIsFocused] = useState(false);
    const text = useQuickInputStore((state) => state.text);
    const picking = useQuickInputStore((state) => state.picking);
    const pickedDate = useQuickInputStore((state) => state.pickedDate);
    const pickedBlockId = useQuickInputStore((state) => state.pickedBlockId);
    const setText = useQuickInputStore((state) => state.setText);
    const setPicking = useQuickInputStore((state) => state.setPicking);
    const setPickedDate = useQuickInputStore((state) => state.setPickedDate);
    const setPickedBlockId = useQuickInputStore((state) => state.setPickedBlockId);
    const resetDraft = useQuickInputStore((state) => state.reset);
    const trimmedText = text.trim();
    const debouncedText = useDebouncedValue(trimmedText, PREVIEW_DEBOUNCE_MS);
    const previewQuery = useQuickInputPreviewQuery(debouncedText);
    const { mutate: save, isPending, isError, reset } = useCreateQuickInputMutation();

    // 화면이 사라지면(로그아웃 등) 적던 내용을 비운다.
    useEffect(() => resetDraft, [resetDraft]);

    // 입력칸을 비우면 미리보기도 감춘다.
    const preview = trimmedText === '' ? null : (previewQuery.data ?? null);
    // 미리보기가 지금 적힌 내용으로 나눈 것인지. 아니면 저장을 막는다. (보이는 것과 다르게 저장되지 않도록)
    const isPreviewCurrent =
        preview !== null &&
        debouncedText === trimmedText &&
        previewQuery.isSuccess &&
        !previewQuery.isPlaceholderData;
    const amount = isPreviewCurrent ? preview.amount : null;
    const canSave = amount !== null;

    const date = preview ? resolvePicked(pickedDate, preview.date) : null;
    const blockId = preview ? resolvePicked(pickedBlockId, preview.block.blockId) : null;
    const block = preview
        ? (preview.blockOptions.find((option) => option.blockId === blockId) ?? preview.block)
        : null;

    // 닫을 때 처음 상태로 되돌려, 다시 열면 빈 칸부터 적게 한다.
    const handleClose = () => {
        resetDraft();
        reset();
        onClose();
    };

    const handleSave = () => {
        if (preview === null || amount === null || date === null || !block || isPending) return;
        save(
            {
                amount,
                memo: preview.memo,
                date,
                categoryName: preview.categoryName,
                blockId: block.blockId,
            },
            { onSuccess: handleClose },
        );
    };

    if (picking && preview && date && block) {
        return (
            <BottomSheet
                isOpen={isOpen}
                onClose={handleClose}
                title={picking === 'date' ? '날짜 고르기' : '블록 고르기'}
                onBack={() => setPicking(null)}
            >
                {picking === 'date' ? (
                    <DateCalendar
                        value={date}
                        today={preview.today}
                        onSelect={(value) => {
                            setPickedDate({ value, parsed: preview.date });
                        }}
                    />
                ) : (
                    <BlockPickList
                        blocks={preview.blockOptions}
                        selectedId={block.blockId}
                        onSelect={(option) => {
                            setPickedBlockId({
                                value: option.blockId,
                                parsed: preview.block.blockId,
                            });
                        }}
                    />
                )}
            </BottomSheet>
        );
    }

    const footerError = isError
        ? '저장하지 못했어요. 잠시 후 다시 시도해 주세요'
        : trimmedText !== '' && previewQuery.isError
          ? '내용을 나누지 못했어요. 잠시 후 다시 적어 주세요'
          : null;

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={handleClose}
            title="빠른 입력"
            description="현금처럼 자동으로 안 잡히는 지출을 적어요"
        >
            <AppText className="mt-1 text-13 leading-[19px] text-ink-sub">
                한 줄로 적어주세요
            </AppText>
            <View
                className={cn(
                    'mt-2 h-14 justify-center rounded-12 bg-white px-4',
                    isFocused ? 'border-2 border-primary-600' : 'border border-line-control',
                )}
            >
                <BottomSheetTextInput
                    accessibilityLabel="빠른 입력"
                    value={text}
                    onChangeText={setText}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    maxLength={MAX_TEXT_LENGTH}
                    placeholder="붕어빵 3000"
                    placeholderTextColor={colors.ink.disabled}
                    returnKeyType="done"
                    style={{
                        padding: 0,
                        fontFamily: fontFamily.semibold,
                        fontSize: 17,
                        color: colors.ink.DEFAULT,
                        includeFontPadding: false,
                    }}
                />
            </View>

            <View className="mt-2 flex-row flex-wrap gap-2">
                {EXAMPLES.map((example) => (
                    <Pressable
                        key={example}
                        accessibilityRole="button"
                        accessibilityHint="입력칸에 채워요"
                        onPress={() => setText(example)}
                        className="h-[30px] justify-center rounded-8 border border-line bg-white px-3 active:bg-surface-neutral"
                    >
                        <AppText className="text-12 text-ink-sub">{example}</AppText>
                    </Pressable>
                ))}
            </View>

            {preview && date && block && (
                <View className={cn('mt-4', !isPreviewCurrent && 'opacity-60')}>
                    <SavePreviewCard
                        preview={preview}
                        date={date}
                        block={block}
                        onPressDate={() => setPicking('date')}
                        onPressBlock={() => setPicking('block')}
                    />
                </View>
            )}

            <AppText className="mt-3 text-12 leading-[18px] text-ink-sub">
                현금 지출은 카드 내역과 맞춰볼 필요가 없어서 바로 확정돼요. 같은 금액의 ATM 출금이
                있으면 두 번 빠지지 않게 한 번 물어볼게요.
            </AppText>

            {footerError && (
                <AppText
                    className="mt-6 text-center text-12 text-danger-text"
                    accessibilityLiveRegion="polite"
                >
                    {footerError}
                </AppText>
            )}
            <Button
                title="저장하기"
                loadingTitle="저장하는 중"
                disabled={!canSave}
                isLoading={isPending}
                onPress={handleSave}
                className={footerError ? 'mt-3' : 'mt-[75px]'}
            />
        </BottomSheet>
    );
}
