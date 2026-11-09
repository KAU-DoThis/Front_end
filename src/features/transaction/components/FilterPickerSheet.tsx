import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import { AppText } from '@/shared/components/ui/AppText';
import { BottomSheet } from '@/shared/components/ui/BottomSheet';
import { Icon } from '@/shared/components/ui/Icon';
import { colors } from '@/styles/tokens';

export interface FilterPickerOption {
    id: number;
    label: string;
    /** 이름 앞 색 점 (블록 색) */
    dotColor?: string;
}

interface FilterPickerSheetProps {
    isOpen: boolean;
    onClose: () => void;
    /** 예: 블록 고르기 */
    title: string;
    /** 맨 위 '전체' 줄 이름 (예: 전체 블록) */
    allLabel: string;
    options: FilterPickerOption[];
    selectedId: number | null;
    /** null이면 전체 */
    onSelect: (id: number | null) => void;
}

/**
 * 블록 · 계좌 필터를 고르는 시트
 * TODO: 시안에 고르는 화면이 없어 기본 목록으로 만들었다. 시안이 나오면 맞춘다.
 */
export function FilterPickerSheet({
    isOpen,
    onClose,
    title,
    allLabel,
    options,
    selectedId,
    onSelect,
}: FilterPickerSheetProps) {
    const rows: (FilterPickerOption | null)[] = [null, ...options];

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
            <View className="pb-2">
                {rows.map((option) => {
                    const id = option?.id ?? null;
                    const isSelected = id === selectedId;
                    return (
                        <Pressable
                            key={id ?? 'all'}
                            accessibilityRole="radio"
                            accessibilityState={{ selected: isSelected }}
                            onPress={() => {
                                onSelect(id);
                                onClose();
                            }}
                            className="min-h-[52px] flex-row items-center gap-3 border-b border-line-soft active:bg-surface-neutral"
                        >
                            {option?.dotColor && (
                                <View
                                    className="h-2 w-2 rounded-[3px]"
                                    style={{ backgroundColor: option.dotColor }}
                                />
                            )}
                            <AppText
                                className={cn(
                                    'flex-1 text-15',
                                    isSelected && 'font-semibold text-primary-700',
                                )}
                            >
                                {option?.label ?? allLabel}
                            </AppText>
                            {isSelected && (
                                <Icon name="check" size={18} color={colors.primary[700]} />
                            )}
                        </Pressable>
                    );
                })}
            </View>
        </BottomSheet>
    );
}
