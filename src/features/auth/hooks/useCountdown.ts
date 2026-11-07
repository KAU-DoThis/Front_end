import { useCallback, useEffect, useState } from 'react';

/**
 * 남은 초를 1초마다 줄인다. 끝나는 시각을 기준으로 계산해 백그라운드에 다녀와도 어긋나지 않는다.
 * restart()를 부르면 그때부터 센다. (부르기 전에는 0초)
 */
export function useCountdown(durationSeconds: number) {
    const [endAt, setEndAt] = useState(0);
    const [now, setNow] = useState(0);

    const remainingSeconds = Math.max(0, Math.ceil((endAt - now) / 1000));
    const isFinished = remainingSeconds === 0;

    useEffect(() => {
        if (isFinished) return;
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [isFinished]);

    const restart = useCallback(() => {
        const startedAt = Date.now();
        setNow(startedAt);
        setEndAt(startedAt + durationSeconds * 1000);
    }, [durationSeconds]);

    return { remainingSeconds, isFinished, restart };
}
