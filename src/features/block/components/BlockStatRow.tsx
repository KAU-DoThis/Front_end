import { View } from 'react-native';

import { cn } from '@/lib/cn';
import { AppText } from '@/shared/components/ui/AppText';

interface BlockStat {
    label: string;
    /** 이미 포맷한 값 (예: 52,700 · 10월 25일) */
    value: string;
}

interface BlockStatRowProps {
    /** 3개 — 마지막 칸은 테두리 상자로 강조한다. (오늘 남음 · 더 필요 · 모자란 돈) */
    stats: [BlockStat, BlockStat, BlockStat];
}

/** 블록 상세 숫자 세 칸 (시안 02 오늘 가능 · 오늘 씀 · 오늘 남음) */
export function BlockStatRow({ stats }: BlockStatRowProps) {
    return (
        <View className="flex-row gap-2">
            {stats.map((stat, index) => {
                const isHighlight = index === stats.length - 1;
                return (
                    <View
                        key={stat.label}
                        className={cn(
                            'h-16 flex-1 p-3',
                            isHighlight ? 'rounded-12 border border-ink bg-white' : 'pl-1',
                        )}
                    >
                        <AppText
                            className={cn(
                                'text-12',
                                isHighlight ? 'font-semibold' : 'text-ink-sub',
                            )}
                        >
                            {stat.label}
                        </AppText>
                        <AppText
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            className="mt-1 font-bold text-17"
                        >
                            {stat.value}
                        </AppText>
                    </View>
                );
            })}
        </View>
    );
}
