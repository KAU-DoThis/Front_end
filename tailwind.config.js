/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    presets: [require('nativewind/preset')],
    theme: {
        extend: {
            colors: {
                // 메인 청록 팔레트 (50 → 900 순으로 진해짐)
                primary: {
                    50: '#E9F7F6',
                    100: '#BFE6E0',
                    300: '#6EC9C3',
                    600: '#2D8F94',
                    900: '#1F3E46',
                },
            },
        },
    },
    plugins: [],
};
