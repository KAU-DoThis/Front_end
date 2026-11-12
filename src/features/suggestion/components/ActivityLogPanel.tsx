import { ScrollView, View } from 'react-native';

import { formatTime, formatWon } from '@/lib/format';
import { AppText } from '@/shared/components/ui/AppText';
import { Icon, type IconName } from '@/shared/components/ui/Icon';
import { colors } from '@/styles/tokens';

import type { CoachMove } from '@/features/suggestion/stores/coachActivityStore';

import { PressableScale } from './PressableScale';

interface ActivityLogPanelProps {
    moves: CoachMove[];
    onPressUndo: (move: CoachMove) => void;
}

interface LogRow {
    key: string;
    icon: IconName;
    isAlert?: boolean;
    title: string;
    caption: string;
    /** undo: 되돌리기 버튼 · undone: 되돌림 표시 */
    trailing?: 'undo' | 'undone';
    move?: CoachMove;
}

/**
 * 시안 8의 나머지 기록 (알림 · 블록 규칙 자동 처리)
 * shortcut: 기록 조회 API가 없어 목업으로 둔다. 서버 기록 API가 생기면 바꾼다.
 */
const MOCK_SECTIONS: { title: string; rows: LogRow[] }[] = [
    {
        title: '어제',
        rows: [
            {
                key: 'mock-saving',
                icon: 'transfer',
                title: '저축에 100,000원 넣음',
                caption: '21:05 · 지난 입금 · 초불이 제안',
            },
            {
                key: 'mock-alert',
                icon: 'bell',
                isAlert: true,
                title: '생활비 주의 알림을 보냄',
                caption: '18:30 · 푸시 알림',
            },
        ],
    },
    {
        title: '10월 12일',
        rows: [
            {
                key: 'mock-rent',
                icon: 'lock',
                title: '월세 600,000원 확보',
                caption: '09:00 · 블록 규칙대로 자동',
            },
        ],
    },
];

/** 8 초불이가 한 일: 이번 실행에서 옮긴 일 + 나머지는 목업 */
export function ActivityLogPanel({ moves, onPressUndo }: ActivityLogPanelProps) {
    const todayRows: LogRow[] = moves.map((move) => ({
        key: `move-${move.proposalId}`,
        icon: 'transfer',
        title: `${move.result.from.name} → ${move.result.to.name} ${formatWon(move.result.amount)} 옮김`,
        caption: `${formatTime(move.performedAt)} · 내가 시킨 일`,
        trailing: move.undoResult ? 'undone' : move.result.undoable ? 'undo' : undefined,
        move,
    }));
    const sections = [
        ...(todayRows.length > 0 ? [{ title: '오늘', rows: todayRows }] : []),
        ...MOCK_SECTIONS,
    ];

    return (
        <View className="gap-3">
            <View className="flex-row items-baseline justify-between">
                <AppText className="font-bold text-20">한 일 기록</AppText>
                <AppText className="text-12 text-ink-sub">
                    돈을 옮긴 일은 7일 안에 되돌릴 수 있어요
                </AppText>
            </View>
            <ScrollView className="max-h-[420px]" contentContainerClassName="gap-3 pb-2">
                {sections.map((section) => (
                    <View key={section.title} className="gap-3">
                        <AppText className="font-semibold text-13 text-ink-sub">
                            {section.title}
                        </AppText>
                        {section.rows.map((row) => (
                            <LogRowView key={row.key} row={row} onPressUndo={onPressUndo} />
                        ))}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

function LogRowView({ row, onPressUndo }: { row: LogRow; onPressUndo: (move: CoachMove) => void }) {
    return (
        <View className="flex-row items-center gap-3">
            <View
                className={`h-9 w-9 items-center justify-center rounded-full ${row.isAlert ? 'bg-caution-soft-bg' : 'bg-primary-50'}`}
            >
                <Icon
                    name={row.icon}
                    size={18}
                    color={row.isAlert ? colors.caution.text : colors.primary[700]}
                />
            </View>
            <View className="flex-1 gap-0.5">
                <AppText className="font-semibold text-15">{row.title}</AppText>
                <AppText className="text-12 text-ink-sub">{row.caption}</AppText>
            </View>
            {row.trailing === 'undo' && row.move && (
                <PressableScale
                    accessibilityHint="옮긴 돈을 되돌려요"
                    onPress={() => row.move && onPressUndo(row.move)}
                >
                    <AppText className="px-1 py-2 font-semibold text-13 text-primary-700">
                        되돌리기
                    </AppText>
                </PressableScale>
            )}
            {row.trailing === 'undone' && (
                <View className="rounded-8 bg-surface-chip px-2 py-1">
                    <AppText className="text-12 text-ink-sub">되돌림</AppText>
                </View>
            )}
        </View>
    );
}
