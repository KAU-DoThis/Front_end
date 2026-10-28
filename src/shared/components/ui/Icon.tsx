import Svg, { Path } from 'react-native-svg';

import { colors } from '@/styles/tokens';

/**
 * 선 아이콘 모음 (Figma '시안 v2' 아이콘 경로 그대로)
 * - viewBox: 시안에서 그린 원래 크기
 * - strokeWidth: 원래 크기 기준 선 두께 (크기를 바꾸면 같은 비율로 커진다)
 */
const ICONS = {
    plus: {
        viewBox: 22,
        strokeWidth: 1.74,
        paths: ['M11.0002 4.58333V17.4167M4.5835 11H17.4168'],
    },
    bell: {
        viewBox: 22,
        strokeWidth: 1.65,
        paths: [
            'M5.5 7.33333C5.5 5.87464 6.07946 4.4757 7.11091 3.44425C8.14236 2.4128 9.54131 1.83333 11 1.83333C12.4587 1.83333 13.8576 2.4128 14.8891 3.44425C15.9205 4.4757 16.5 5.87464 16.5 7.33333C16.5 13.75 19.25 15.5833 19.25 15.5833H2.75C2.75 15.5833 5.5 13.75 5.5 7.33333Z',
            'M9.44189 19.25C9.58644 19.5396 9.80881 19.7832 10.0841 19.9534C10.3593 20.1237 10.6766 20.2138 11.0002 20.2138C11.3239 20.2138 11.6411 20.1237 11.9164 19.9534C12.1916 19.7832 12.414 19.5396 12.5586 19.25',
        ],
    },
    user: {
        viewBox: 22,
        strokeWidth: 1.65,
        paths: [
            'M11.0002 11C13.0252 11 14.6668 9.35838 14.6668 7.33333C14.6668 5.30829 13.0252 3.66667 11.0002 3.66667C8.97512 3.66667 7.3335 5.30829 7.3335 7.33333C7.3335 9.35838 8.97512 11 11.0002 11Z',
            'M3.6665 19.25C3.6665 15.5833 7.33317 13.75 10.9998 13.75C14.6665 13.75 18.3332 15.5833 18.3332 19.25',
        ],
    },
    'chevron-right': {
        viewBox: 18,
        strokeWidth: 1.5,
        paths: ['M6.75 4.5L11.25 9L6.75 13.5'],
    },
} as const;

export type IconName = keyof typeof ICONS;

interface IconProps {
    name: IconName;
    /** 가로·세로 크기 (px) */
    size?: number;
    /** 선 색. className을 쓸 수 없어 tokens.js 값을 넘긴다. (기본 text/default) */
    color?: string;
    /** 실제 화면 기준 선 두께 (px). 생략하면 시안 비율을 따른다. */
    strokeWidth?: number;
}

/** 선 아이콘. 시안과 다른 굵기가 필요할 때만 strokeWidth를 넘긴다. */
export function Icon({ name, size, color = colors.ink.DEFAULT, strokeWidth }: IconProps) {
    const icon = ICONS[name];
    const renderSize = size ?? icon.viewBox;
    // strokeWidth(px)를 viewBox 단위로 바꾼다.
    const stroke =
        strokeWidth === undefined ? icon.strokeWidth : (strokeWidth * icon.viewBox) / renderSize;

    return (
        <Svg
            width={renderSize}
            height={renderSize}
            viewBox={`0 0 ${icon.viewBox} ${icon.viewBox}`}
            fill="none"
        >
            {icon.paths.map((d) => (
                <Path
                    key={d}
                    d={d}
                    stroke={color}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            ))}
        </Svg>
    );
}
