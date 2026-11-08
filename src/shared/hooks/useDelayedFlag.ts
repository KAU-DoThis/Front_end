import { useEffect, useState } from 'react';

/**
 * isActive가 delayMs 넘게 이어지면 true가 된다. isActive가 false가 되면 바로 false로 돌아간다.
 * 예: CODEF 응답이 30초를 넘으면 '은행 응답이 늦어지고 있어요' 안내를 보여준다.
 */
export function useDelayedFlag(isActive: boolean, delayMs: number) {
    const [isDelayed, setIsDelayed] = useState(false);

    useEffect(() => {
        if (!isActive) return;
        const timer = setTimeout(() => setIsDelayed(true), delayMs);
        return () => {
            clearTimeout(timer);
            // 다음에 다시 켜질 때 처음부터 세도록 되돌린다.
            setIsDelayed(false);
        };
    }, [isActive, delayMs]);

    return isActive && isDelayed;
}
