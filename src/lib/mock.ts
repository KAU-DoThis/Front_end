/**
 * 목업 API를 쓸지 정한다.
 * - EXPO_PUBLIC_USE_MOCK=true / false 로 직접 정할 수 있다. (중간발표 시연용 preview APK는 true)
 * - 값이 없으면 개발 빌드(__DEV__)에서만 목업을 쓴다.
 * TODO: 목업을 쓰는 API가 모두 실제 API로 바뀌면 이 파일과 환경 변수를 지운다.
 */
const flag = process.env.EXPO_PUBLIC_USE_MOCK;

export const USE_MOCK = flag === 'true' || (flag !== 'false' && __DEV__);
