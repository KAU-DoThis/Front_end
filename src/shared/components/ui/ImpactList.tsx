import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import { AppText } from '@/shared/components/ui/AppText';
import { Icon } from '@/shared/components/ui/Icon';
import { colors } from '@/styles/tokens';

/** good 좋아지거나 그대로 지켜짐 · warn 나빠짐 · danger 규칙이 깨짐 · info 숫자만 바뀜 */
export type ImpactSeverity = 'good' | 'warn' | 'danger' | 'info';

/** 결과 한 줄 (서버 POST /simulate 응답 items 그대로) */
export interface ImpactItem {
    /** status_change · goal_date · monthly_secured · payment · daily_budget · saving_pace */
    type: string;
    severity: ImpactSeverity;
    blockId?: string | number;
    /** 결론 (상태 · 날짜 · 부족액) */
    title: string;
    /** 근거 숫자 (전 → 후) */
    detail?: string;
}

interface ImpactListProps {
    /** 예: 배분하면 이렇게 바뀌어요, 이동 전 검증 */
    title: string;
    subtitle?: string;
    items: ImpactItem[];
    className?: string;
}

/** 한 카드에 최대 3줄, 넘치면 접는다. */
const MAX_VISIBLE = 3;

// 위험한 것부터 보여준다. (danger → warn → good → info)
const SEVERITY_ORDER: Record<ImpactSeverity, number> = { danger: 0, warn: 1, good: 2, info: 3 };

/**
 * 결과 목록 (ImpactList) — 바꾸기 전과 후를 비교한 결과를 보여주는 회색 카드.
 * 06 배분 · 03-2 이동 전 검증이 같이 쓴다. 문장과 숫자는 서버가 만든 그대로 쓴다.
 */
export function ImpactList({ title, subtitle, items, className }: ImpactListProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const sorted = [...items].sort(
        (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
    );
    const hiddenCount = Math.max(0, sorted.length - MAX_VISIBLE);
    const visible = isExpanded ? sorted : sorted.slice(0, MAX_VISIBLE);

    return (
        <View className={cn('rounded-16 bg-surface-neutral p-4', className)}>
            <AppText className="font-bold text-15">{title}</AppText>
            {subtitle && <AppText className="mt-0.5 text-12 text-ink-sub">{subtitle}</AppText>}
            <View className="mt-4 gap-3">
                {visible.map((item, index) => (
                    <View
                        key={`${item.type}-${item.blockId ?? ''}-${index}`}
                        className="flex-row gap-3"
                    >
                        <SeverityIcon severity={item.severity} />
                        <View className="flex-1 gap-0.5">
                            <AppText className="font-semibold text-15">{item.title}</AppText>
                            {item.detail && (
                                <AppText className="text-12 text-ink-sub">{item.detail}</AppText>
                            )}
                        </View>
                    </View>
                ))}
            </View>
            {hiddenCount > 0 && !isExpanded && (
                <Pressable
                    accessibilityRole="button"
                    hitSlop={10}
                    onPress={() => setIsExpanded(true)}
                    className="mt-4 flex-row items-center justify-end gap-0.5 active:opacity-60"
                >
                    <AppText className="font-semibold text-13">
                        나머지 {hiddenCount}개 자세히
                    </AppText>
                    <Icon name="chevron-down" size={14} />
                </Pressable>
            )}
        </View>
    );
}

const ICON_STYLE = {
    good: { container: 'bg-white', text: '' },
    warn: { container: 'bg-caution', text: 'text-caution-text' },
    danger: { container: 'bg-danger-bg', text: 'text-danger-text' },
    info: { container: 'bg-white', text: 'text-ink-sub' },
} as const;

function SeverityIcon({ severity }: { severity: ImpactSeverity }) {
    const style = ICON_STYLE[severity];

    return (
        <View
            className={cn(
                'h-[22px] w-[22px] items-center justify-center rounded-[6px]',
                style.container,
            )}
        >
            {severity === 'good' ? (
                <Icon name="check" size={14} color={colors.primary[700]} />
            ) : (
                <AppText className={cn('font-bold text-13', style.text)}>
                    {severity === 'info' ? '–' : '!'}
                </AppText>
            )}
        </View>
    );
}
