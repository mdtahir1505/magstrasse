// Run: npx tsx src/engine/lock.test.ts
export {};
const ok = (c: unknown, msg = 'assertion') => { if (!c) throw new Error('FAIL: ' + msg); };

const m = new Map<string, string>();
(globalThis as unknown as { localStorage: unknown }).localStorage = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
const { setPin, verifyPin, isLockEnabled, disableLock, lockoutMs, lockAvailable } = await import('./lock');

ok(lockAvailable());
ok(!isLockEnabled());
await setPin('1234');
ok(isLockEnabled());
ok(await verifyPin('1234'), 'right pin');
ok(!(await verifyPin('0000')), 'wrong pin');
for (let i = 0; i < 4; i++) await verifyPin('0000');   // 5 wrong in total now
ok(lockoutMs() > 29_000 && lockoutMs() <= 30_000, 'locked out after 5');
ok(!(await verifyPin('1234')), 'correct pin refused while locked out');
m.set('strasse:lock:fails', JSON.stringify({ count: 5, until: Date.now() - 1 }));
ok(await verifyPin('1234'), 'works after lockout expires');
ok(!m.has('strasse:lock:fails'), 'counter reset on success');
disableLock();
ok(!isLockEnabled());
console.log('lock ok');
