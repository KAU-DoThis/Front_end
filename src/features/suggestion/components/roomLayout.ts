/**
 * 초불이의 방 배치 (시안 '초불이의 방' 1·1-1, 방 그림 390 × 372 기준 좌표)
 * 화면 너비에 맞춰 방 전체를 같은 비율로 줄이거나 늘린다.
 */
export const ROOM_SIZE = { width: 390, height: 372 } as const;

/**
 * 이름표가 모두 들어가는 방 그림 높이. 이 아래(바닥 끝)는 하단 패널에 가려도 된다.
 * 화면이 낮으면 이 높이가 패널 위에 다 보이도록 방 전체를 줄인다.
 */
export const ROOM_LABEL_SAFE_HEIGHT = 340;

/** 이름표를 화면 가장자리에서 띄우는 거리 (px) */
export const LABEL_EDGE_INSET = 8;

/** 초불이 묶음(후광·그림자·캐릭터)의 기준 상자 = 후광 크기 */
export const CHARACTER_BOX = 151;

/**
 * 스프라이트 프레임 위치 (기준 상자 151 기준)
 * 캐릭터 키(그림자 제외)가 예전 그림과 같은 112가 되게 프레임을 146으로 두고,
 * 발바닥(프레임 y 93.36%)을 예전 발 위치(x 76.5, y 132)에 맞췄다.
 */
export const CHARACTER_SPRITE = { x: 5, y: -4, size: 146 } as const;

/** 바닥 그림자 (기준 상자 151 기준). 발바닥 아래에 붙어 있고 캐릭터와 같이 숨쉬지 않는다. */
export const CHARACTER_SHADOW = { x: 44, y: 123, width: 64, height: 14 } as const;

/** 묶음 안 발바닥 위치 (기준 상자 151 기준). 돌아다닐 때 발 위치로 묶음 위치를 구한다. */
export const CHARACTER_FEET = { x: 76.5, y: 132 } as const;

/**
 * 돌아다니는 범위: 러그 위 마름모 (발바닥 기준, 방 좌표)
 * 가운데는 방 가운데 자리의 발 위치와 같다. depthScale: 맨 안쪽 0.94배 ~ 맨 앞 1.06배
 */
export const WANDER_AREA = { cx: 190.5, cy: 272, rx: 70, ry: 38, depthScale: 0.06 } as const;

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

/** 방 가운데 초불이 위 말풍선 (2·4·8-2 응답) */
export const CENTER_BUBBLE = { x: 70, y: 52, width: 250, tailLeft: 120 } as const;
