import { useEffect, useState } from 'react';

/** 값이 delay 동안 바뀌지 않으면 그때 반영한다. (입력할 때마다 요청하지 않도록) */
export function useDebouncedValue<T>(value: T, delay: number) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounced;
}
