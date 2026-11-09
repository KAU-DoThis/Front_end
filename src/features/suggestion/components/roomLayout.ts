/**
 * 초불이의 방 배치 (시안 '초불이의 방' 1·1-1, 방 그림 390 × 372 기준 좌표)
 * 화면 너비에 맞춰 방 전체를 같은 비율로 줄이거나 늘린다.
 */
export const ROOM_SIZE = { width: 390, height: 372 } as const;

/** 초불이 묶음(후광·그림자·캐릭터)의 기준 상자 = 후광 크기 */
export const CHARACTER_BOX = 151;

/** 묶음 안에서의 위치 (기준 상자 151 기준) */
export const CHARACTER_PARTS = {
    character: { x: 34, y: 20, width: 85, height: 112 },
    shadow: { x: 44, y: 123, width: 64, height: 14 },
} as const;

/** 방 상태별 초불이 묶음 위치와 크기 */
export const CHARACTER_SPOTS = {
    /** 방 가운데 러그 위 */
    center: { x: 114, y: 140, scale: 1 },
    /** 선반 앞 (1-1) */
    shelf: { x: 87, y: 147, scale: 132 / 151 },
} as const;

/** 방 안 물건 라벨 (알약 왼쪽 위 좌표) */
export const OBJECT_SPOTS = {
    frame: { x: 112, y: 37 },
    plant: { x: 208, y: 103 },
    desk: { x: 300, y: 193 },
    shelf: { x: 24, y: 228 },
    receipt: { x: 262, y: 301 },
} as const;

export type RoomObject = keyof typeof OBJECT_SPOTS;

/** 선반을 눌렀을 때 선반 둘레에 그리는 동그라미 */
export const SHELF_RING = { x: 53, y: 140, size: 74 } as const;

/** 선반 앞 말풍선 (1-1) */
export const SHELF_BUBBLE = { x: 120, y: 48, width: 240, tailLeft: 38 } as const;
