import * as SecureStore from 'expo-secure-store';

import { isMockLoginEmail } from '@/features/auth/api/authApi';
import type { LoginRequest } from '@/features/auth/types/auth';
import { USE_MOCK } from '@/lib/mock';

/**
 * 카카오/구글 버튼용 기기 계정. (실제 소셜 OAuth는 연동하지 않음)
 * 앱에 계정 정보를 넣지 않으려고, 처음 누를 때 이 기기에서 임의의 이메일·비밀번호로 가입하고 SecureStore에 둔다.
 * 다음부터는 이 계정으로 로그인한다. 사용자는 비밀번호를 모르니 이 계정은 소셜 버튼으로만 들어갈 수 있다.
 * shortcut: 실제 소셜 로그인(POST /auth/kakao)을 붙이면 지운다.
 */
const EMAIL_KEY = 'socialLoginEmail';
const PASSWORD_KEY = 'socialLoginPassword';

const RANDOM_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

function randomString(length: number) {
    const bytes = new Uint8Array(length);
    if (typeof globalThis.crypto?.getRandomValues === 'function') {
        globalThis.crypto.getRandomValues(bytes);
    } else {
        // 런타임에 crypto가 없을 때만 쓴다. (개발 서버 전용 계정이라 이 정도로 둔다)
        for (let i = 0; i < length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(bytes, (byte) => RANDOM_CHARS[byte % RANDOM_CHARS.length]).join('');
}

/** 새 기기 계정. 서버 가입 조건(이메일 형식, 비밀번호 8~64자)에 맞춘다. */
export function createSocialAccount(): LoginRequest {
    return {
        // 실제 사용자와 겹치지 않도록 예약된 도메인(example.com)을 쓴다.
        email: `social-${randomString(12)}@example.com`,
        password: randomString(32),
    };
}

/**
 * 저장된 기기 계정. 없거나 읽지 못하면 null이다.
 * 목업 모드에서 목업 가입 기록(메모리)이 사라진 계정은 실제 서버로 로그인 요청이 가지 않도록 null로 본다.
 */
export async function getSavedSocialAccount(): Promise<LoginRequest | null> {
    try {
        const [email, password] = await Promise.all([
            SecureStore.getItemAsync(EMAIL_KEY),
            SecureStore.getItemAsync(PASSWORD_KEY),
        ]);
        if (!email || !password) return null;
        if (USE_MOCK && !isMockLoginEmail(email)) return null;
        return { email, password };
    } catch {
        return null;
    }
}

/** 가입 전에 저장한다. 가입하지 않고 나가면 다음 로그인이 실패해 새 계정으로 다시 가입한다. */
export async function saveSocialAccount(account: LoginRequest) {
    await SecureStore.setItemAsync(EMAIL_KEY, account.email);
    await SecureStore.setItemAsync(PASSWORD_KEY, account.password);
}
