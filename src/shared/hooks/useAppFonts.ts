import { useFonts } from 'expo-font';

import { fontFamily } from '@/styles/tokens';

/**
 * 앱에서 쓰는 Pretendard 3종을 불러온다.
 * 런타임 로딩이라 폰트를 바꿔도 개발 빌드를 다시 만들 필요가 없다.
 */
export function useAppFonts() {
    return useFonts({
        [fontFamily.regular]: require('@/assets/fonts/pretendard-regular.otf'),
        [fontFamily.semibold]: require('@/assets/fonts/pretendard-semibold.otf'),
        [fontFamily.bold]: require('@/assets/fonts/pretendard-bold.otf'),
    });
}
