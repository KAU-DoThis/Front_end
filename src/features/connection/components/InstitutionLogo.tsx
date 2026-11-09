import { Image, View, type ImageSourcePropType } from 'react-native';

/**
 * 기관 로고 (CODEF 기관 코드 → 이미지)
 * 로고 파일을 src/assets/images/institutions/에 넣고 여기에 등록한다.
 * 파일명은 영문 kebab-case, @2x·@3x를 같이 넣는다. (예: bank-kb.png, card-shinhan.png)
 *   '0004': require('@/assets/images/institutions/bank-kb.png'),
 */
const KB_LOGO = require('@/assets/images/institutions/bank-kb.png');
const NH_LOGO = require('@/assets/images/institutions/bank-nh.png');
const SHINHAN_LOGO = require('@/assets/images/institutions/bank-shinhan.png');
const WOORI_LOGO = require('@/assets/images/institutions/bank-woori.png');
const HANA_LOGO = require('@/assets/images/institutions/bank-hana.png');
const KAKAO_LOGO = require('@/assets/images/institutions/bank-kakao.png');
const IBK_LOGO = require('@/assets/images/institutions/bank-ibk.png');
const TOSS_LOGO = require('@/assets/images/institutions/bank-toss.png');
const KBANK_LOGO = require('@/assets/images/institutions/bank-kbank.png');
const SAMSUNG_CARD_LOGO = require('@/assets/images/institutions/card-samsung.png');
const HYUNDAI_CARD_LOGO = require('@/assets/images/institutions/card-hyundai.png');
const LOTTE_CARD_LOGO = require('@/assets/images/institutions/card-lotte.png');
const BC_CARD_LOGO = require('@/assets/images/institutions/card-bc.png');

/**
 * 은행과 카드사가 같은 회사면 같은 로고를 쓴다.
 * (같은 회사: KB국민 0004·0301, 신한 0088·0306, 하나 0081·0313, 우리 0020·0309, NH농협 0011·0304)
 */
const INSTITUTION_LOGOS: Partial<Record<string, ImageSourcePropType>> = {
    '0004': KB_LOGO,
    '0301': KB_LOGO,
    '0011': NH_LOGO,
    '0304': NH_LOGO,
    '0088': SHINHAN_LOGO,
    '0306': SHINHAN_LOGO,
    '0020': WOORI_LOGO,
    '0309': WOORI_LOGO,
    '0081': HANA_LOGO,
    '0313': HANA_LOGO,
    '0090': KAKAO_LOGO,
    '0003': IBK_LOGO,
    '0092': TOSS_LOGO,
    '0089': KBANK_LOGO,
    '0303': SAMSUNG_CARD_LOGO,
    '0302': HYUNDAI_CARD_LOGO,
    '0311': LOTTE_CARD_LOGO,
    '0305': BC_CARD_LOGO,
};

/**
 * 심볼 없이 글자로 된 가로형 로고. 36px 원에 넣으면 글자가 너무 작아져서 72×36 칸에 넣는다.
 * 이미지도 72×36(@2x 144×72, @3x 216×108)으로 만든다.
 */
const WIDE_LOGO_CODES = new Set(['0302', '0311']);

interface InstitutionLogoProps {
    code: string;
}

/** 36px 둥근 로고 (가로형은 72×36). 등록된 로고가 없으면 시안의 점선 자리 표시를 보여준다. */
export function InstitutionLogo({ code }: InstitutionLogoProps) {
    const source = INSTITUTION_LOGOS[code];

    if (!source) {
        return <View className="h-9 w-9 rounded-full border border-dashed border-line-control" />;
    }
    return (
        <Image
            source={source}
            className={WIDE_LOGO_CODES.has(code) ? 'h-9 w-18' : 'h-9 w-9 rounded-full'}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
        />
    );
}
