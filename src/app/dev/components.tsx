import { Redirect } from 'expo-router';

import { ComponentGalleryScreen } from '@/features/dev/screens/ComponentGalleryScreen';

// 개발 모드에서만 열린다. 배포 빌드에서는 홈으로 돌려보낸다.
export default function DevComponentsRoute() {
    if (!__DEV__) {
        return <Redirect href="/" />;
    }
    return <ComponentGalleryScreen />;
}
