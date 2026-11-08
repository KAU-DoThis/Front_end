import * as SecureStore from 'expo-secure-store';

/**
 * 가입은 했지만 온보딩(계좌 연동 → 블록 구성)을 아직 마치지 않은 계정을 기억한다.
 * 온보딩 중에 로그아웃하거나 앱을 껐다 켜도 다시 온보딩으로 보내기 위해서다.
 * TODO: 온보딩 완료 여부를 서버(로그인 응답 또는 내 정보 API)에서 받으면 이 저장소는 지운다.
 */
const PENDING_EMAILS_KEY = 'onboardingPendingEmails';
/** 지금 로그인한 계정 (앱을 다시 켤 때 어느 계정인지 알아야 한다) */
const CURRENT_EMAIL_KEY = 'onboardingCurrentEmail';

const normalize = (email: string) => email.trim().toLowerCase();

async function readPendingEmails(): Promise<string[]> {
    const raw = await SecureStore.getItemAsync(PENDING_EMAILS_KEY);
    if (!raw) return [];
    try {
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed)
            ? parsed.filter((value): value is string => typeof value === 'string')
            : [];
    } catch {
        return [];
    }
}

async function writePendingEmails(emails: string[]) {
    if (emails.length === 0) {
        await SecureStore.deleteItemAsync(PENDING_EMAILS_KEY);
        return;
    }
    await SecureStore.setItemAsync(PENDING_EMAILS_KEY, JSON.stringify(emails));
}

export const onboardingStorage = {
    /** 방금 가입한 계정을 '온보딩 안 끝남'으로 기록한다. */
    async markPending(email: string) {
        const target = normalize(email);
        const emails = await readPendingEmails();
        if (!emails.includes(target)) {
            await writePendingEmails([...emails, target]);
        }
    },

    async isPending(email: string) {
        const emails = await readPendingEmails();
        return emails.includes(normalize(email));
    },

    /** 온보딩을 마친 계정을 목록에서 뺀다. */
    async clearPending(email: string) {
        const target = normalize(email);
        const emails = await readPendingEmails();
        await writePendingEmails(emails.filter((value) => value !== target));
    },

    getCurrentEmail: () => SecureStore.getItemAsync(CURRENT_EMAIL_KEY),
    setCurrentEmail: (email: string) =>
        SecureStore.setItemAsync(CURRENT_EMAIL_KEY, normalize(email)),
    /** 로그아웃할 때 지운다. 온보딩 안 끝난 계정 목록은 남겨서 다시 로그인하면 이어서 하게 한다. */
    clearCurrentEmail: () => SecureStore.deleteItemAsync(CURRENT_EMAIL_KEY),
};
