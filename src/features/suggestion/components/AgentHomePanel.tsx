import { View } from 'react-native';

import { formatRelativeDay, formatWon } from '@/lib/format';
import { AppText } from '@/shared/components/ui/AppText';
import { Mascot } from '@/shared/components/ui/Mascot';
import { MiniBeaker } from '@/shared/components/ui/MiniBeaker';

import type { AgentRoom } from '@/features/suggestion/types/agentRoom';

import { ChatInput } from './ChatInput';
import { PressableScale } from './PressableScale';

interface AgentHomePanelProps {
    room: AgentRoom;
    /** 칩을 누르거나 채팅바로 보낸 명령 */
    onCommand: (text: string) => void;
}

/** 방 아래 패널 (시안 1): 오늘 쓸 수 있는 돈 · 바로 시키기 · 초불이가 한 일 · 채팅바 */
export function AgentHomePanel({ room, onCommand }: AgentHomePanelProps) {
    return (
        <View className="gap-4.5">
            <View className="flex-row items-center gap-3">
                <Mascot className="h-11 w-11" />
                <View className="flex-1 gap-0.75">
                    <AppText className="font-bold text-17 leading-[23px]">
                        오늘 쓸 수 있는 돈은 {formatWon(room.todayAvailable)}이에요
                    </AppText>
                    <AppText className="text-13 text-ink-sub">
                        블록에 시킬 일이 있으면 말해 주세요
                    </AppText>
                </View>
            </View>

            {room.quickCommands.length > 0 && (
                <View className="gap-2.5">
                    <AppText className="font-semibold text-13 text-ink-sub">바로 시키기</AppText>
                    <View className="flex-row flex-wrap gap-2">
                        {room.quickCommands.map((command) => (
                            <PressableScale
                                key={command}
                                accessibilityHint="초불이에게 이 일을 시켜요"
                                onPress={() => onCommand(command)}
                            >
                                <View className="h-11 justify-center rounded-full border border-line-control bg-white px-4">
                                    <AppText className="text-15">{command}</AppText>
                                </View>
                            </PressableScale>
                        ))}
                    </View>
                </View>
            )}

            {room.lastAction && (
                // 누르면 기록 화면으로 가는 건 기록 화면 작업 때 붙인다.
                <View className="flex-row items-center gap-3 rounded-16 border border-line bg-white py-3 pl-4 pr-4">
                    <MiniBeaker
                        color={room.lastAction.blockColor}
                        status="SAFE"
                        fillRate={room.lastAction.blockFillRate}
                    />
                    <View className="flex-1 gap-0.5">
                        <AppText className="text-12 text-ink-sub">
                            {formatRelativeDay(room.lastAction.performedAt)} 초불이가 한 일
                        </AppText>
                        <AppText className="font-semibold text-15 leading-[21px]">
                            {room.lastAction.message}
                        </AppText>
                    </View>
                </View>
            )}

            <ChatInput onSubmit={onCommand} />
        </View>
    );
}
