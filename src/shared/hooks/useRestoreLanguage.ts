import { useEffect, useState } from 'react';

import { restoreLanguage } from '@/lib/i18n';

/**
 * 저장해 둔 언어를 앱 시작 때 한 번 되살린다.
 * 되살리기에 실패해도 기본 언어로 계속하므로, 끝나면 항상 true가 된다.
 */
export function useRestoreLanguage() {
    const [isRestored, setIsRestored] = useState(false);

    useEffect(() => {
        restoreLanguage().finally(() => setIsRestored(true));
    }, []);

    return isRestored;
}
