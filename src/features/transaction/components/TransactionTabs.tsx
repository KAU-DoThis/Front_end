import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import { withAlpha } from '@/lib/color';
import { AppText } from '@/shared/components/ui/AppText';
import { colors } from '@/styles/tokens';

import type { TransactionTab } from '@/features/transaction/types/transaction';

const TABS: { value: TransactionTab; label: string }[] = [
    { value: 'LIST', label: '거래 목록' },
    { value: 'ANALYSIS', label: '소비 분석' },
];

/** 고른 칸 아래 옅은 그림자 (시안 0 1 1.5 · text/default 12%) */
const SELECTED_SHADOW = { boxShadow: `0px 1px 1.5px 0px ${withAlpha(colors.ink.DEFAULT, 0.12)}` };

interface TransactionTabsProps {
    value: TransactionTab;
    onChange: (value: TransactionTab) => void;
}

/** 거래 목록 / 소비 분석 전환 (높이 42 · 세그먼트) */
export function TransactionTabs({ value, onChange }: TransactionTabsProps) {
    return (
        <View
            accessibilityRole="tablist"
            className="h-[42px] flex-row rounded-12 bg-surface-segmented p-1"
        >
            {TABS.map((tab) => {
                const isSelected = tab.value === value;
                return (
                    <Pressable
                        key={tab.value}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: isSelected }}
                        onPress={() => onChange(tab.value)}
                        className={cn(
                            'flex-1 items-center justify-center rounded-12',
                            isSelected && 'bg-white',
                        )}
                        style={isSelected ? SELECTED_SHADOW : undefined}
                    >
                        <AppText
                            className={cn(
                                'text-15',
                                isSelected ? 'font-bold text-primary-700' : 'text-ink-sub',
                            )}
                        >
                            {tab.label}
                        </AppText>
                    </Pressable>
                );
            })}
        </View>
    );
}
