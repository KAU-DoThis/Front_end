import enCommon from './en/common.json';
import koCommon from './ko/common.json';

/** 앱에서 고를 수 있는 언어 (첫 번째가 기본값) */
export const LANGUAGES = ['ko', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'ko';

/**
 * 언어별 문구. 네임스페이스는 common + 도메인(features 폴더 이름)으로 나눈다.
 * 새 네임스페이스를 만들면 ko·en 둘 다 여기에 등록한다.
 */
export const resources = {
    ko: { common: koCommon },
    en: { common: enCommon },
} as const;

export const DEFAULT_NAMESPACE = 'common';
