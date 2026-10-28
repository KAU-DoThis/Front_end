import Svg, { Path } from 'react-native-svg';

import { colors } from '@/styles/tokens';

interface LogoProps {
    /** 가로·세로 크기 (px, 시안 22) */
    size?: number;
}

/** 핀트리스 로고 심볼 (Figma '시안 v2' logo 경로 그대로) */
export function Logo({ size = 22 }: LogoProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
            <Path
                d="M5.5 1H2.5C1.67157 1 1 1.67157 1 2.5V5.5C1 6.32843 1.67157 7 2.5 7H5.5C6.32843 7 7 6.32843 7 5.5V2.5C7 1.67157 6.32843 1 5.5 1Z"
                fill={colors.primary[600]}
            />
            <Path
                d="M12.5 1H9.5C8.67157 1 8 1.67157 8 2.5V5.5C8 6.32843 8.67157 7 9.5 7H12.5C13.3284 7 14 6.32843 14 5.5V2.5C14 1.67157 13.3284 1 12.5 1Z"
                fill={colors.primary[600]}
            />
            <Path
                d="M19.5 1H16.5C15.6716 1 15 1.67157 15 2.5V5.5C15 6.32843 15.6716 7 16.5 7H19.5C20.3284 7 21 6.32843 21 5.5V2.5C21 1.67157 20.3284 1 19.5 1Z"
                fill={colors.primary[600]}
            />
            <Path
                d="M12.5 8H9.5C8.67157 8 8 8.67157 8 9.5V12.5C8 13.3284 8.67157 14 9.5 14H12.5C13.3284 14 14 13.3284 14 12.5V9.5C14 8.67157 13.3284 8 12.5 8Z"
                fill={colors.primary[300]}
            />
        </Svg>
    );
}
