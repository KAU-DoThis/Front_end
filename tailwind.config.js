const tokens = require('./src/styles/tokens');

const px = (value) => `${value}px`;

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    presets: [require('nativewind/preset')],
    theme: {
        // 기본 크기 대신 디자인 토큰만 쓴다. (text-15, text-17 …)
        fontSize: Object.fromEntries(
            Object.entries(tokens.fontSize).map(([key, [size, lineHeight]]) => [
                key,
                [px(size), { lineHeight: px(lineHeight) }],
            ]),
        ),
        // 굵기는 폰트 패밀리로 정한다. (font-regular, font-semibold, font-bold)
        fontFamily: Object.fromEntries(
            Object.entries(tokens.fontFamily).map(([key, family]) => [key, [family]]),
        ),
        fontWeight: {},
        // 모서리 (rounded-8, rounded-12, rounded-14, rounded-16, rounded-24, rounded-full)
        borderRadius: {
            none: '0px',
            ...Object.fromEntries(tokens.radius.map((value) => [value, px(value)])),
            full: '9999px',
        },
        extend: {
            colors: tokens.colors,
            spacing: {
                0.75: '3px', // 상태칩 위아래 여백
                13.5: '54px', // 큰 버튼 높이
            },
        },
    },
    plugins: [],
};
