export const DEFAULT_TIMEOUT_MS = 10_000;

export interface JsonResponse<T> {
    status: number;
    body: T | null;
    text: string;
}

export async function postJson<T>(url: string, init: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<JsonResponse<T>> {
    const res = await fetch(url, { ...init, signal: init.signal ?? AbortSignal.timeout(timeoutMs) });
    const text = await res.text();
    let body: T | null = null;
    try {
        body = text ? (JSON.parse(text) as T) : null;
    } catch {
        body = null;
    }
    return { status: res.status, body, text };
}

export function failure(res: JsonResponse<unknown>, fallback = 'unexpected response'): { ok: false; detail: string } {
    return { ok: false, detail: `${res.status}: ${res.text.slice(0, 200) || fallback}` };
}
