import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import { AppText } from '@/shared/components/ui/AppText';
import { BottomSheet } from '@/shared/components/ui/BottomSheet';

export interface BlockMenuItem {
    label: string;
    onPress: () => void;
    /** 빨간 글씨 (블록 삭제) */
    isDanger?: boolean;
}

interface BlockMenuSheetProps {
    isOpen: boolean;
    onClose: () => void;
    items: BlockMenuItem[];
}

/** 블록 상세 '⋯' 메뉴. 시안이 없어 필터 고르기 시트의 줄 모양을 따른다. 누르면 닫고 그 일을 한다. */
export function BlockMenuSheet({ isOpen, onClose, items }: BlockMenuSheetProps) {
    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="블록 관리">
            <View className="pb-2">
                {items.map((item, index) => (
                    <Pressable
                        key={item.label}
                        accessibilityRole="button"
                        onPress={() => {
                            onClose();
                            item.onPress();
                        }}
                        className={cn(
                            'min-h-[52px] flex-row items-center active:bg-surface-neutral',
                            index < items.length - 1 && 'border-b border-line-soft',
                        )}
                    >
                        <AppText className={cn('text-15', item.isDanger && 'text-danger-text')}>
                            {item.label}
                        </AppText>
                    </Pressable>
                ))}
            </View>
        </BottomSheet>
    );
}
