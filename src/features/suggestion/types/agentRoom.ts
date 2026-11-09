import type { BlockColor } from '@/shared/components/ui/BlockBeaker';
import type { Status } from '@/shared/components/ui/StatusTag';

/**
 * 초불이의 방 응답 (백엔드 API 미정 — 시안 '초불이의 방' 1·1-1 기준 목업 모양)
 * 숫자는 서버가 계산해 내려주고, 앱은 그대로 표시만 한다.
 */
export interface AgentRoom {
    /** 내 블록 수 */
    blockCount: number;
    /** 주의·위험 블록 수 (상단 상태 줄, 선반 말풍선) */
    attentionBlockCount: number;
    /** 오늘 쓸 수 있는 돈 */
    todayAvailable: number;
    /** 액자: 가장 가까운 목표 (없으면 null) */
    goal: RoomGoal | null;
    /** 화분: 이번 달 확정 절약분 */
    confirmedSaving: number;
    /** 영수증 상자: 확인할 거래 수 (맥락 질문 대기) */
    uncheckedTransactionCount: number;
    /** 바로 시키기 칩 */
    quickCommands: string[];
    /** 초불이가 마지막으로 한 일 (없으면 null) */
    lastAction: AgentAction | null;
    /** 선반을 눌렀을 때 보여줄 블록 요약 (1-1) */
    shelfBlocks: ShelfBlock[];
}

export interface RoomGoal {
    blockId: number;
    name: string;
    /** 달성률 0~100 */
    achievementRate: number;
}

export interface AgentAction {
    /** ISO 8601 */
    performedAt: string;
    message: string;
    /** 돈이 들어간 블록 (작은 비커 아이콘) */
    blockColor: BlockColor;
    blockFillRate: number;
}

export interface ShelfBlock {
    blockId: number;
    name: string;
    color: BlockColor;
    status: Status;
    /** 물 높이 0~100 */
    fillRate: number;
    balance: number;
    /** 상태 대신 보여줄 표시 (고정지출형 D-11, 목표 달성 등). 없으면 상태 칩 */
    badge: string | null;
}
