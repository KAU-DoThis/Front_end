import { Pressable, View } from 'react-native';

import type { Institution } from '@/features/connection/types/connection';
import { cn } from '@/lib/cn';
import { AppText } from '@/shared/components/ui/AppText';
import { Icon } from '@/shared/components/ui/Icon';
import { colors } from '@/styles/tokens';

import { InstitutionLogo } from './InstitutionLogo';

interface InstitutionTileProps {
    institution: Institution;
    isSelected: boolean;
    /** 이미 연결을 마친 기관. 고른 상태로 고정하고 다시 누를 수 없다. */
    isConnected?: boolean;
    disabled?: boolean;
    onPress: () => void;
}

/** 기관 고르기 칸 (92 · 16). 고르면 청록 2px 테두리 + 오른쪽 위 체크 (시안 00-4) */
export function InstitutionTile({
    institution,
    isSelected,
    isConnected = false,
    disabled = false,
    onPress,
}: InstitutionTileProps) {
    const isChecked = isSelected || isConnected;
    const isDisabled = disabled || isConnected;

    return (
        <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isChecked, disabled: isDisabled }}
            accessibilityLabel={isConnected ? `${institution.name} 연결됨` : institution.name}
            disabled={isDisabled}
            onPress={onPress}
            className={cn(
                'flex-1 items-center gap-2 rounded-16 bg-white py-4 active:bg-surface-neutral',
                isChecked ? 'border-2 border-primary-700' : 'border border-line',
            )}
        >
            <InstitutionLogo code={institution.code} />
            <AppText numberOfLines={1} className={cn('text-13', isChecked && 'font-bold')}>
                {institution.name}
            </AppText>
            {isChecked && (
                <View className="absolute right-2 top-2 h-5 w-5 items-center justify-center rounded-8 bg-primary-700">
                    <Icon name="check" size={13} color={colors.white} strokeWidth={1.9} />
                </View>
            )}
        </Pressable>
    );
}
