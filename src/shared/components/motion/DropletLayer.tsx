import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import {
    Easing,
    useAnimatedReaction,
    useReducedMotion,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming,
    type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Droplet } from './Droplet';

/**
 * 물방울 레이어 — 자금 이동 드래그(03-1)와 초불이 연출이 같이 쓴다.
 *
 * - 블록 위치 레지스트리: 블록마다 useDropTarget(id)로 등록해 두면, 드래그 시작 때 화면 좌표를 한 번 잰다.
 * - 물방울: 위치·늘어남·방향을 UI 스레드 값으로 들고 있다가 레이어 맨 위에 그린다.
 * - 손가락으로 끌 때는 useBlockDragGesture, 손 없이 옮기는 연출(초불이)은 flyTo를 쓴다.
 */

interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** 꾹 누르고 있어야 물방울이 뽑히는 시간 */
const LONG_PRESS_MS = 400;
/** 이 속도(px/s)에서 꼬리가 가장 길다. */
const MAX_SPEED = 1800;
/** 이보다 느리면 방향을 바꾸지 않는다. (손 떨림에 물방울이 돌지 않게) */
const MIN_TURN_SPEED = 80;
/** 손가락이 이만큼 멈춰 있으면 3단계(흔들리며 동그래짐)를 시작한다. */
const SETTLE_DELAY_MS = 110;

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);
/** 멈췄을 때 2~3번 흔들리고 원형으로 (보드 3단계) */
const WOBBLE = { damping: 6, stiffness: 260, mass: 0.6 } as const;

export interface DragState {
    /** 물방울을 뽑은 블록 */
    sourceId: number | null;
    /** 지금 손가락 아래 있는 다른 블록 */
    hoverId: number | null;
}

interface DropletLayerValue {
    registerTarget: (id: number, view: View | null) => void;
    dragState: DragState;
    /** 아래는 useBlockDragGesture·flyTo 내부용 */
    beginDrag: (sourceId: number, color: string) => void;
    endDrag: () => void;
    shared: {
        x: SharedValue<number>;
        y: SharedValue<number>;
        stretch: SharedValue<number>;
        angle: SharedValue<number>;
        opacity: SharedValue<number>;
        scale: SharedValue<number>;
        sourceId: SharedValue<number>;
        hoverId: SharedValue<number>;
        rects: SharedValue<Record<number, Rect>>;
        origin: SharedValue<{ x: number; y: number }>;
    };
    isReducedMotion: boolean;
    flyTo: (fromId: number, toId: number, color: string) => Promise<void>;
}

const DropletLayerContext = createContext<DropletLayerValue | null>(null);

/** 없음 표시 (shared value는 null보다 숫자가 다루기 쉬워서) */
const NONE = -1;

function useDropletLayer() {
    const value = useContext(DropletLayerContext);
    if (!value) {
        throw new Error('DropletLayerProvider 안에서만 쓸 수 있습니다.');
    }
    return value;
}

function measureInWindow(view: View) {
    return new Promise<Rect>((resolve) => {
        view.measureInWindow((x, y, width, height) => resolve({ x, y, width, height }));
    });
}

/** 손가락 아래 블록 찾기 (보내는 블록은 빼고) */
function hitTest(rects: Record<number, Rect>, x: number, y: number, excludeId: number) {
    'worklet';
    for (const key of Object.keys(rects)) {
        const id = Number(key);
        const rect = rects[id];
        if (
            id !== excludeId &&
            x >= rect.x &&
            x <= rect.x + rect.width &&
            y >= rect.y &&
            y <= rect.y + rect.height
        ) {
            return id;
        }
    }
    return NONE;
}

export function DropletLayerProvider({ children }: { children: ReactNode }) {
    const targets = useRef(new Map<number, View>());
    const layerRef = useRef<View>(null);
    const [color, setColor] = useState('transparent');
    const [dragState, setDragState] = useState<DragState>({ sourceId: null, hoverId: null });
    const isReducedMotion = useReducedMotion();

    const x = useSharedValue(0);
    const y = useSharedValue(0);
    const stretch = useSharedValue(0);
    const angle = useSharedValue(0);
    const opacity = useSharedValue(0);
    const scale = useSharedValue(1);
    const sourceId = useSharedValue(NONE);
    const hoverId = useSharedValue(NONE);
    const rects = useSharedValue<Record<number, Rect>>({});
    // 물방울 레이어의 화면 좌표 (손가락 좌표를 레이어 좌표로 바꿀 때 뺀다)
    const origin = useSharedValue({ x: 0, y: 0 });

    // 받는 블록이 바뀔 때만 JS로 알린다. (태그 · 안내 문구용)
    useAnimatedReaction(
        () => hoverId.get(),
        (current, previous) => {
            if (current !== previous) {
                scheduleOnRN(setDragState, {
                    sourceId: sourceId.get() === NONE ? null : sourceId.get(),
                    hoverId: current === NONE ? null : current,
                });
            }
        },
    );

    const registerTarget = useCallback((id: number, view: View | null) => {
        if (view) {
            targets.current.set(id, view);
        } else {
            targets.current.delete(id);
        }
    }, []);

    /** 드래그 중엔 스크롤이 잠기므로 시작할 때 한 번만 잰다. */
    const measureTargets = useCallback(async () => {
        const layer = layerRef.current;
        if (layer) {
            const { x: ox, y: oy } = await measureInWindow(layer);
            origin.set({ x: ox, y: oy });
        }
        const entries = await Promise.all(
            [...targets.current.entries()].map(
                async ([id, view]) => [id, await measureInWindow(view)] as const,
            ),
        );
        rects.set(Object.fromEntries(entries));
    }, [origin, rects]);

    const beginDrag = useCallback(
        (id: number, nextColor: string) => {
            setColor(nextColor);
            setDragState({ sourceId: id, hoverId: null });
            measureTargets();
        },
        [measureTargets],
    );

    const endDrag = useCallback(() => {
        setDragState({ sourceId: null, hoverId: null });
    }, []);

    /**
     * 손가락 없이 A 블록에서 B 블록으로 물방울 보내기 (초불이 연출용)
     * 드래그와 같은 물방울·같은 움직임 규칙을 쓴다.
     */
    const flyTo = useCallback(
        async (fromId: number, toId: number, nextColor: string) => {
            await measureTargets();
            const from = rects.get()[fromId];
            const to = rects.get()[toId];
            if (!from || !to) {
                return;
            }
            setColor(nextColor);
            const start = {
                x: from.x + from.width / 2 - origin.get().x,
                y: from.y + from.height / 2 - origin.get().y,
            };
            const end = {
                x: to.x + to.width / 2 - origin.get().x,
                y: to.y + to.height / 2 - origin.get().y,
            };
            const duration = isReducedMotion ? 0 : 650;

            x.set(start.x);
            y.set(start.y);
            angle.set(Math.atan2(end.y - start.y, end.x - start.x));
            stretch.set(0);
            scale.set(0.9);
            opacity.set(withTiming(1, { duration: 140, easing: EASE_OUT }));
            scale.set(withTiming(1, { duration: 140, easing: EASE_OUT }));

            await new Promise<void>((resolve) => {
                x.set(withTiming(end.x, { duration, easing: EASE_IN_OUT }));
                y.set(
                    withTiming(end.y, { duration, easing: EASE_IN_OUT }, () => {
                        scheduleOnRN(resolve);
                    }),
                );
                if (!isReducedMotion) {
                    stretch.set(
                        withSequence(
                            withTiming(0.7, { duration: duration * 0.4 }),
                            withSpring(0, WOBBLE),
                        ),
                    );
                }
            });
            opacity.set(withTiming(0, { duration: 160, easing: EASE_OUT }));
        },
        [angle, isReducedMotion, measureTargets, opacity, origin, rects, scale, stretch, x, y],
    );

    const handleLayerLayout = useCallback(
        (_event: LayoutChangeEvent) => {
            layerRef.current?.measureInWindow((ox, oy) => {
                origin.set({ x: ox, y: oy });
            });
        },
        [origin],
    );

    const value = useMemo<DropletLayerValue>(
        () => ({
            registerTarget,
            dragState,
            beginDrag,
            endDrag,
            shared: { x, y, stretch, angle, opacity, scale, sourceId, hoverId, rects, origin },
            isReducedMotion,
            flyTo,
        }),
        [
            registerTarget,
            dragState,
            beginDrag,
            endDrag,
            x,
            y,
            stretch,
            angle,
            opacity,
            scale,
            sourceId,
            hoverId,
            rects,
            origin,
            isReducedMotion,
            flyTo,
        ],
    );

    return (
        <DropletLayerContext.Provider value={value}>
            <View
                ref={layerRef}
                className="flex-1"
                onLayout={handleLayerLayout}
                collapsable={false}
            >
                {children}
                <Droplet
                    x={x}
                    y={y}
                    stretch={stretch}
                    angle={angle}
                    opacity={opacity}
                    scale={scale}
                    color={color}
                />
            </View>
        </DropletLayerContext.Provider>
    );
}

/**
 * 블록을 레지스트리에 등록한다. 돌려받은 ref를 블록을 감싼 View에 붙인다.
 * 등록된 블록은 물방울을 놓을 수 있는 자리가 된다.
 */
export function useDropTarget(id: number) {
    const { registerTarget } = useDropletLayer();
    return useCallback((view: View | null) => registerTarget(id, view), [id, registerTarget]);
}

/** 드래그 중인 블록 · 손가락 아래 블록 (태그 · 안내 문구 · 흐리게 표시용) */
export function useDragState() {
    return useDropletLayer().dragState;
}

/** 손가락 없이 물방울 보내기 (초불이 연출용) */
export function useDropletFlyTo() {
    return useDropletLayer().flyTo;
}

interface BlockDragOptions {
    blockId: number;
    /** 물방울 색 (보내는 블록 물 색) */
    color: string;
    enabled?: boolean;
    /** 물방울을 뽑았을 때 (스크롤 잠그기 등) */
    onStart?: () => void;
    /** 다른 블록 위에서 놓았을 때 */
    onDrop: (toBlockId: number) => void;
    /** 놓은 뒤 항상 (스크롤 풀기 등) */
    onEnd?: () => void;
}

/**
 * 블록을 꾹 눌러 물방울을 뽑아 끄는 제스처 (03-1)
 * 꾹 누르기 전엔 스크롤이 이기고, 물방울이 뽑힌 뒤엔 드래그가 이긴다.
 */
export function useBlockDragGesture({
    blockId,
    color,
    enabled = true,
    onStart,
    onDrop,
    onEnd,
}: BlockDragOptions) {
    const { shared, beginDrag, endDrag, isReducedMotion } = useDropletLayer();

    const handleStart = useCallback(() => {
        beginDrag(blockId, color);
        onStart?.();
    }, [beginDrag, blockId, color, onStart]);

    const handleEnd = useCallback(
        (toId: number) => {
            endDrag();
            onEnd?.();
            if (toId !== NONE) {
                onDrop(toId);
            }
        },
        [endDrag, onDrop, onEnd],
    );

    return useMemo(() => {
        const { x, y, stretch, angle, opacity, scale, sourceId, hoverId, rects, origin } = shared;

        return Gesture.Pan()
            .enabled(enabled)
            .activateAfterLongPress(LONG_PRESS_MS)
            .onStart((event) => {
                // 1단계: 손가락 자리에서 동그란 물방울이 살짝 커지며 나타난다.
                sourceId.set(blockId);
                hoverId.set(NONE);
                x.set(event.absoluteX - origin.get().x);
                y.set(event.absoluteY - origin.get().y);
                stretch.set(0);
                scale.set(0.9);
                scale.set(withTiming(1, { duration: 160, easing: EASE_OUT }));
                opacity.set(withTiming(1, { duration: 120, easing: EASE_OUT }));
                scheduleOnRN(handleStart);
            })
            .onUpdate((event) => {
                x.set(event.absoluteX - origin.get().x);
                y.set(event.absoluteY - origin.get().y);
                hoverId.set(hitTest(rects.get(), event.absoluteX, event.absoluteY, blockId));

                if (isReducedMotion) {
                    return;
                }
                // 2단계: 빠를수록 꼬리가 길다. 3단계: 손가락이 멈추면 흔들리다 동그래진다.
                const speed = Math.hypot(event.velocityX, event.velocityY);
                if (speed > MIN_TURN_SPEED) {
                    angle.set(Math.atan2(event.velocityY, event.velocityX));
                }
                stretch.set(
                    withSequence(
                        withTiming(Math.min(1, speed / MAX_SPEED), { duration: 80 }),
                        withDelay(SETTLE_DELAY_MS, withSpring(0, WOBBLE)),
                    ),
                );
            })
            .onFinalize(() => {
                // 짧게 누르기만 했거나 다른 블록의 드래그면 할 일이 없다.
                if (sourceId.get() !== blockId) {
                    return;
                }
                const toId = hoverId.get();
                const fromRect = rects.get()[blockId];
                if (toId === NONE && fromRect) {
                    // 놓을 자리가 아니면 원래 블록으로 돌아가며 사라진다.
                    x.set(
                        withTiming(fromRect.x + fromRect.width / 2 - origin.get().x, {
                            duration: 220,
                            easing: EASE_OUT,
                        }),
                    );
                    y.set(
                        withTiming(fromRect.y + fromRect.height / 2 - origin.get().y, {
                            duration: 220,
                            easing: EASE_OUT,
                        }),
                    );
                }
                stretch.set(withTiming(0, { duration: 120 }));
                opacity.set(withTiming(0, { duration: 180, easing: EASE_OUT }));
                scale.set(withTiming(0.9, { duration: 180, easing: EASE_OUT }));
                sourceId.set(NONE);
                hoverId.set(NONE);
                scheduleOnRN(handleEnd, toId);
            });
    }, [blockId, enabled, handleEnd, handleStart, isReducedMotion, shared]);
}
