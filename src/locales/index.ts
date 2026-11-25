import deCommon from './de/common.json';
import enCommon from './en/common.json';
import esCommon from './es/common.json';
import frCommon from './fr/common.json';
import jaCommon from './ja/common.json';
import koCommon from './ko/common.json';
import viCommon from './vi/common.json';
import zhCommon from './zh/common.json';

/** 앱에서 고를 수 있는 언어 (첫 번째가 기본값). 서버에는 Accept-Language로 이 코드를 그대로 보낸다. */
export const LANGUAGES = ['ko', 'en', 'ja', 'zh', 'es', 'fr', 'de', 'vi'] as const;
export type Language = (typeof LANGUAGES)[number];

/** 기본 언어는 LANGUAGES 첫 번째 값 하나로만 정한다. (순서를 바꾸면 기본값도 같이 바뀐다) */
export const DEFAULT_LANGUAGE: Language = LANGUAGES[0];

/** 언어 선택 목록에 보여줄 이름 (각 언어로 적는다) */
export const LANGUAGE_NAMES: Record<Language, string> = {
    ko: '한국어',
    en: 'English',
    ja: '日本語',
    zh: '简体中文',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    vi: 'Tiếng Việt',
};

/**
 * 언어별 문구. 네임스페이스는 common + 도메인(features 폴더 이름)으로 나눈다.
 * 새 네임스페이스를 만들면 모든 언어에 등록한다. (ko가 기준, 나머지는 ko를 번역해 채운다)
 */
export const resources = {
    ko: { common: koCommon },
    en: { common: enCommon },
    ja: { common: jaCommon },
    zh: { common: zhCommon },
    es: { common: esCommon },
    fr: { common: frCommon },
    de: { common: deCommon },
    vi: { common: viCommon },
} as const;

export const DEFAULT_NAMESPACE = 'common';
