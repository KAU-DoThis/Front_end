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
    /** 어느 블록 메뉴인지 보이게 블록 이름을 제목으로 쓴다. */
    title: string;
    items: BlockMenuItem[];
}

/**
 * 블록 상세 '⋯' 메뉴. 시안이 없어 필터 고르기 시트의 줄 모양을 따른다. 누르면 닫고 그 일을 한다.
 * 위험한 항목(삭제)은 실수로 누르지 않게 위를 조금 띄운다.
 */
export function BlockMenuSheet({ isOpen, onClose, title, items }: BlockMenuSheetProps) {
    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
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
                            item.isDanger && index > 0 && 'mt-2',
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
