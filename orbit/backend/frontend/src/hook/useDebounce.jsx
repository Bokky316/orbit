import { useState, useEffect } from 'react';

/**
 * Debounce hook
 * - 디바운싱을 적용하여 사용자의 타이핑이 멈춘 후에만 API를 호출하도록 함
 * - value가 변경되면 delay 시간이 지나야만 debouncedValue가 변경됨
 *
 * @param value
 * @param delay
 * @returns {unknown}
 */
export default function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}
