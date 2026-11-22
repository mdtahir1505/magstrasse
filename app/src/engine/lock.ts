// Casual PIN lock: keeps a picked-up phone out of the app. Not encryption (progress stays plain in localStorage).
const KEY = 'strasse:lock';
const FAILS = 'strasse:lock:fails';
const ITER = 210000;

const b64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)) as Uint8Array<ArrayBuffer>;
const get = (k: string) => { try { return JSON.parse(localStorage.getItem(k) ?? 'null'); } catch { return null; } };
const put = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* blocked */ } };

async function derive(pin: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256));
}

export const lockAvailable = () => typeof crypto !== 'undefined' && !!crypto.subtle;
export const isLockEnabled = () => !!get(KEY)?.hash;

export async function setPin(pin: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  put(KEY, { salt: b64(salt), hash: b64(await derive(pin, salt, ITER)), iterations: ITER });
  localStorage.removeItem(FAILS);
}

/** Milliseconds left in the current lockout (0 = free to try). */
export const lockoutMs = () => Math.max(0, (get(FAILS)?.until ?? 0) - Date.now());

/** False while locked out (the attempt is not counted) or on a wrong PIN. */
export async function verifyPin(pin: string): Promise<boolean> {
  const rec = get(KEY);
  if (!rec?.hash || lockoutMs() > 0) return false;
  const got = await derive(pin, unb64(rec.salt), rec.iterations);
  const want = unb64(rec.hash);
  let diff = got.length ^ want.length;
  for (let i = 0; i < got.length; i++) diff |= got[i] ^ (want[i] ?? 0);
  if (diff === 0) { localStorage.removeItem(FAILS); return true; }
  const count = (get(FAILS)?.count ?? 0) + 1;
  put(FAILS, { count, until: count >= 5 ? Date.now() + Math.min(30_000 * 2 ** (count - 5), 900_000) : 0 });
  return false;
}

export function disableLock() { try { localStorage.removeItem(KEY); localStorage.removeItem(FAILS); } catch { /* ignore */ } }
