import { formatMonthDay } from '@/lib/format';

import type { GoalGuardOption } from '@/features/block/types/goalGuard';

import { GoalChoiceCard } from './GoalChoiceCard';

interface GoalGuardOptionCardProps {
    option: GoalGuardOption;
    isSelected: boolean;
    onPress: () => void;
}

/** 맞출 방법 한 개 (라디오 카드). 오른쪽은 이 방법을 쓰면 다 모이는 날 (시안 16) */
export function GoalGuardOptionCard({ option, isSelected, onPress }: GoalGuardOptionCardProps) {
    return (
        <GoalChoiceCard
            title={option.title}
            description={option.description}
            badge={option.isRecommended ? '에이전트 추천' : undefined}
            result={{ value: formatMonthDay(option.resultDate), label: option.resultLabel }}
            isSelected={isSelected}
            onPress={onPress}
        />
    );
}
