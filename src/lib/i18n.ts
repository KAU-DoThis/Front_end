import * as SecureStore from 'expo-secure-store';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import {
    DEFAULT_LANGUAGE,
    DEFAULT_NAMESPACE,
    LANGUAGES,
    resources,
    type Language,
} from '@/locales';

// 고른 언어는 expo-secure-store에 둔다. (AsyncStorage 사용 금지)
const LANGUAGE_KEY = 'language';

const isLanguage = (value: string | null): value is Language =>
    value !== null && (LANGUAGES as readonly string[]).includes(value);

const i18n = createInstance();

// 문구를 앱에 함께 넣어 두므로 바로(동기로) 초기화된다. 앱을 켜면 restoreLanguage로 고른 언어를 되살린다.
i18n.use(initReactI18next).init({
    resources,
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: LANGUAGES,
    defaultNS: DEFAULT_NAMESPACE,
    ns: Object.keys(resources[DEFAULT_LANGUAGE]),
    initAsync: false,
    // React가 이스케이프하므로 i18next에서는 하지 않는다.
    interpolation: { escapeValue: false },
    returnNull: false,
});

/** 지금 언어 */
export const getLanguage = (): Language =>
    isLanguage(i18n.language) ? i18n.language : DEFAULT_LANGUAGE;

/** 저장해 둔 언어로 되돌린다. 읽지 못하면 기본 언어로 둔다. (앱 시작 시 한 번) */
export async function restoreLanguage() {
    try {
        const saved = await SecureStore.getItemAsync(LANGUAGE_KEY);
        if (isLanguage(saved) && saved !== i18n.language) {
            await i18n.changeLanguage(saved);
        }
    } catch {
        // 기본 언어로 계속한다.
    }
}

/** 언어를 바꾸고 저장한다. (설정 화면에서 쓴다) 저장에 실패해도 이번 실행에서는 바뀐다. */
export async function changeLanguage(language: Language) {
    await i18n.changeLanguage(language);
    await SecureStore.setItemAsync(LANGUAGE_KEY, language).catch(() => undefined);
}

export default i18n;
