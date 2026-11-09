import type { BlockType } from '@/features/block/types/block';
import type { BlockColor } from '@/shared/components/ui/BlockBeaker';

/**
 * 블록 유형 이름. 블록 상세(BlockHeroCard)의 TYPE_LABEL과 같은 값이다.
 * TODO: 블록 상세의 TYPE_LABEL을 공통으로 옮기면 그것을 쓰고 이 상수는 지운다.
 */
export const BLOCK_TYPE_LABEL = {
    SPENDING: '사용형',
    GOAL: '목표형',
    FIXED: '고정지출형',
} as const;

export const BLOCK_TYPES: BlockType[] = ['SPENDING', 'GOAL', 'FIXED'];

/** 고를 수 있는 블록 색 (시안 04 색상 순서) */
export const BLOCK_COLORS: BlockColor[] = ['i', 'o', 't', 's', 'z', 'j', 'l'];

/** 블록 색 면 className. Tailwind가 찾을 수 있도록 클래스 이름을 통째로 적는다. */
export const BLOCK_COLOR_BG_CLASS: Record<BlockColor, string> = {
    i: 'bg-block-i-safe',
    o: 'bg-block-o-safe',
    t: 'bg-block-t-safe',
    s: 'bg-block-s-safe',
    z: 'bg-block-z-safe',
    j: 'bg-block-j-safe',
    l: 'bg-block-l-safe',
};

/** 블록 색 이름 (스크린리더용) */
export const BLOCK_COLOR_LABEL: Record<BlockColor, string> = {
    i: '청록',
    o: '노랑',
    t: '보라',
    s: '연두',
    z: '분홍',
    j: '파랑',
    l: '주황',
};

/** 사용형 기간: 1일 시작이면 "매월 1일부터 말일까지", 그 외 "매월 10일부터 다음 달 9일까지" */
export function formatSpendingPeriod(startDay: number) {
    return startDay === 1
        ? '매월 1일부터 말일까지'
        : `매월 ${startDay}일부터 다음 달 ${startDay - 1}일까지`;
}
