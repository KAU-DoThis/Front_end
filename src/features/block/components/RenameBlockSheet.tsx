import { useState } from 'react';
import { View } from 'react-native';

import { cn } from '@/lib/cn';
import { AppText } from '@/shared/components/ui/AppText';
import { BottomSheet, BottomSheetTextInput } from '@/shared/components/ui/BottomSheet';
import { Button } from '@/shared/components/ui/Button';
import { ApiError } from '@/shared/types/api';
import { colors, fontFamily } from '@/styles/tokens';

import { useRenameBlockMutation } from '@/features/block/api/useRenameBlockMutation';

/** 04 블록 구성의 이름 칸과 같은 길이 제한 */
const MAX_NAME_LENGTH = 20;

interface RenameBlockSheetProps {
    isOpen: boolean;
    onClose: () => void;
    blockId: number;
    currentName: string;
    /** 열 때마다 바꿔 주면 입력값·오류가 지금 이름에서 새로 시작한다. */
    formKey: number;
}

/** 블록 상세 '더보기' → 블록 이름 바꾸기 */
export function RenameBlockSheet({
    isOpen,
    onClose,
    blockId,
    currentName,
    formKey,
}: RenameBlockSheetProps) {
    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="블록 이름 바꾸기">
            <RenameBlockForm
                key={formKey}
                blockId={blockId}
                currentName={currentName}
                onSaved={onClose}
            />
        </BottomSheet>
    );
}

interface RenameBlockFormProps {
    blockId: number;
    currentName: string;
    onSaved: () => void;
}

function RenameBlockForm({ blockId, currentName, onSaved }: RenameBlockFormProps) {
    const [name, setName] = useState(currentName);
    const [isFocused, setIsFocused] = useState(false);
    const { mutate: rename, isPending, error } = useRenameBlockMutation();

    const trimmed = name.trim();
    const canSave = trimmed !== '' && trimmed !== currentName && !isPending;
    const errorMessage = error
        ? error instanceof ApiError
            ? error.message
            : '이름을 바꾸지 못했어요. 잠시 후 다시 시도해 주세요'
        : null;

    const handleSave = () => {
        if (!canSave) return;
        rename({ blockId, name: trimmed }, { onSuccess: onSaved });
    };

    return (
        <View>
            <View
                className={cn(
                    'h-11 justify-center rounded-12 bg-white px-3',
                    errorMessage
                        ? 'border-2 border-danger-text'
                        : isFocused
                          ? 'border-2 border-primary-700'
                          : 'border border-line-control',
                )}
            >
                <BottomSheetTextInput
                    accessibilityLabel="블록 이름"
                    value={name}
                    onChangeText={setName}
                    // 저장 중에 고친 이름은 저장되지 않고 시트가 닫히므로 입력을 잠근다.
                    editable={!isPending}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    maxLength={MAX_NAME_LENGTH}
                    placeholder="블록 이름"
                    placeholderTextColor={colors.ink.disabled}
                    returnKeyType="done"
                    onSubmitEditing={handleSave}
                    style={{
                        padding: 0,
                        fontFamily: fontFamily.regular,
                        fontSize: 15,
                        color: colors.ink.DEFAULT,
                        includeFontPadding: false,
                    }}
                />
            </View>
            {errorMessage && (
                <AppText className="mt-2 text-12 text-danger-text" accessibilityLiveRegion="polite">
                    {errorMessage}
                </AppText>
            )}
            <Button
                className="mt-4"
                title="저장"
                loadingTitle="저장 중"
                isLoading={isPending}
                disabled={!canSave}
                onPress={handleSave}
            />
        </View>
    );
}
