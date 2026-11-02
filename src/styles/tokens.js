/**
 * 디자인 토큰 (Figma '시안 v2' 디자인 시스템 보드 기준)
 *
 * tailwind.config.js가 이 파일을 불러와 className 토큰을 만든다.
 * className을 쓸 수 없는 곳(ActivityIndicator color, 바텀시트 style 등)에서만 직접 import한다.
 * 값을 바꿀 때는 Figma 변수(Fintris Colors)와 같이 바꾼다.
 */

const colors = {
    white: '#FFFFFF', // bg/base: 화면 바탕, 카드, 시트
    // 메인 청록 팔레트 (50 → 900 순으로 진해짐)
    primary: {
        50: '#E9F7F6', // bg/surface: 강조 카드, 감소 칩
        100: '#BFE6E0', // brand/primary-subtle: 테두리, 지난달 막대
        300: '#6EC9C3', // brand/primary-light: 어두운 카드 위 강조 숫자
        600: '#2D8F94', // brand/primary: 진행바, 그래프 이번 달
        700: '#23767A', // brand/primary-strong: 버튼, 링크
        800: '#1C6468', // brand/primary-pressed: 버튼 눌림
        900: '#1F3E46', // brand/primary-dark: 총자산 카드, 점수 카드
    },
    // 글자 (text/*)
    ink: {
        DEFAULT: '#1F3E46', // 본문 · 금액 · 제목
        sub: '#5B7278', // 보조 설명 · 라벨
        disabled: '#A9B8BA', // 비활성 · 입력 힌트
        safe: '#1F5F63', // 안전 칩 글씨
    },
    // 면 (bg/*) — 화면 바탕·카드·시트는 white
    surface: {
        app: '#F4FAF9', // 입력칸 · 보조 면
        neutral: '#F2F5F5', // 보조 면 · 결과 목록 카드 · 목록 눌림
        chip: '#EEF2F2', // 증가 칩 · 보조 버튼 눌림
        segmented: '#E3EFED', // 세그먼트 버튼 바탕
        disabled: '#E1EAE9', // 비활성 버튼 면
        'input-disabled': '#F4F7F7', // 비활성 입력칸 면
    },
    // 선 (line/*)
    line: {
        DEFAULT: '#DCEDEA', // 카드 테두리, 탭바 선
        soft: '#EEF5F4', // 목록 구분선, 그래프 바탕
        control: '#7E9294', // 입력칸 · 보조 버튼 테두리 (흰 바탕 3:1)
        disabled: '#C9D3D3', // 비활성 점선 테두리
        handle: '#CFDCDB', // 바텀시트 손잡이
    },
    // 상태 · 주의 (status/caution-*)
    caution: {
        DEFAULT: '#FFD66B', // 주의 칩 배경
        text: '#4A3000', // 주의 칩 글씨
        dot: '#E5A100', // 주의 점, 소진 속도 그래프
        body: '#5C3D00', // 주의 배너 본문 글씨
        'soft-bg': '#FFF4D6', // 연한 주의 표시 바탕
        'soft-text': '#8A5A00', // 연한 주의 표시 글씨
    },
    // 상태 · 위험 (status/danger-*)
    danger: {
        DEFAULT: '#E5484D', // 위험 점
        bg: '#FDE7E8', // 위험 칩 배경
        text: '#B4363B', // 위험 칩 글씨, 입력 오류
    },
    // 증감 (delta/*) — 파랑: 내 돈이 늘어나는 쪽, 빨강: 줄어드는 쪽
    delta: {
        up: '#2B6CD4',
        'up-bg': '#EAF1FC',
        'up-on-dark': '#8DB8FF',
        down: '#B4363B',
        'down-bg': '#FDE7E8',
    },
    // 소셜 로그인 — 카카오 디자인 가이드 색 그대로 쓴다.
    kakao: {
        DEFAULT: '#FEE500', // 카카오 버튼 바탕
        label: '#000000', // 카카오 버튼 글씨
    },
    // 블록 색 (block/{I~L}/{safe · caution · danger}) — 상태가 나빠질수록 채도가 빠진다
    block: {
        i: { safe: '#6EC9C3', caution: '#86B1AF', danger: '#94A4A3' }, // 청록
        o: { safe: '#F5D98B', caution: '#D9CBA6', danger: '#C9C4B6' }, // 노랑
        t: { safe: '#B79AD8', caution: '#B8ABC7', danger: '#B9B4BE' }, // 보라
        s: { safe: '#B5DB8A', caution: '#B4C5A0', danger: '#B3B9AC' }, // 연두
        z: { safe: '#F2A7B8', caution: '#DDBCC4', danger: '#D2C7CA' }, // 분홍
        j: { safe: '#8FB3E8', caution: '#A7B7D0', danger: '#B5BAC2' }, // 파랑
        l: { safe: '#F4B98A', caution: '#D7BCA7', danger: '#C7BEB7' }, // 주황
    },
};

/** 화면을 어둡게 덮는 막 (바텀시트 뒤) — primary-900 50% */
const dimOpacity = 0.5;

/**
 * 글자 크기 [px, 행간 px] — 행간은 한 줄 기준 약 1.2배
 * 11·10은 상태칩·배지·차트 축에만 쓴다.
 */
const fontSize = {
    10: [10, 12],
    11: [11, 13],
    12: [12, 14],
    13: [13, 16],
    15: [15, 18],
    16: [16, 19],
    17: [17, 20],
    20: [20, 24],
    24: [24, 29],
    30: [30, 36],
};

/**
 * 폰트 패밀리 — Android는 fontWeight로 커스텀 폰트 굵기가 바뀌지 않아 굵기마다 이름을 따로 등록한다.
 * 키는 useFonts에 넘기는 이름과 같아야 한다.
 */
const fontFamily = {
    regular: 'Pretendard-Regular',
    semibold: 'Pretendard-SemiBold',
    bold: 'Pretendard-Bold',
};

/** 모서리 — 8 칩 · 12 중간/작은 버튼·입력 · 14 큰 버튼 · 16 카드 · 24 큰 카드 · 시트 */
const radius = [8, 12, 14, 16, 24];

module.exports = { colors, dimOpacity, fontSize, fontFamily, radius };
