import 'i18next';

import type { DEFAULT_NAMESPACE, resources } from '@/locales';

/** t('...') 키를 한국어 문구 파일 기준으로 검사한다. 없는 키는 타입 오류가 난다. */
declare module 'i18next' {
    interface CustomTypeOptions {
        defaultNS: typeof DEFAULT_NAMESPACE;
        resources: (typeof resources)['ko'];
    }
}
