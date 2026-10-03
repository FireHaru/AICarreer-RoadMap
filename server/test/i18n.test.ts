import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';

process.env.PGLITE_DIR = 'memory://';
process.env.AI_PROVIDER = '';
process.env.GEMINI_API_KEY = '';
process.env.OPENAI_API_KEY = '';

const { initDb, closeDb } = await import('../src/db/client.js');
const { createApp } = await import('../src/app.js');
const { loadCatalog } = await import('../src/engine/catalog.js');
const { DEMO_USER } = await import('../src/db/seed.js');

let base = '';
let server: ReturnType<ReturnType<typeof createApp>['listen']>;

async function call(method: string, path: string, opts: { body?: unknown; token?: string; lang?: string } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': opts.lang ?? 'vi',
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  return { status: res.status, body: (await res.json()) as any };
}

before(async () => {
  await initDb();
  server = createApp().listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
});
after(async () => {
  server.close();
  await closeDb();
});

describe('Vietnamese', () => {
  it('translates every catalog entity', async () => {
    const { getDb } = await import('../src/db/client.js');
    const en = await loadCatalog(getDb(), 'en');
    const vi = await loadCatalog(getDb(), 'vi');
    const untranslated = [
      ...en.courseList.filter((c) => vi.courses.get(c.id)!.description === c.description).map((c) => c.code),
      ...[...en.skills.values()].filter((s) => vi.skills.get(s.id)!.description === s.description).map((s) => s.slug),
      ...[...en.careers.values()].filter((c) => vi.careers.get(c.id)!.description === c.description).map((c) => c.slug),
      ...[...en.research.values()].filter((r) => vi.research.get(r.id)!.description === r.description).map((r) => r.slug),
      ...en.projects.filter((p) => vi.projects.find((x) => x.id === p.id)!.description === p.description).map((p) => p.slug),
      ...[...en.paths.values()].filter((p) => vi.paths.get(p.id)!.name === p.name).map((p) => `path:${p.id}`),
    ];
    assert.deepEqual(untranslated, []);
    assert.equal(vi.careersBySlug.get('ai-engineer')!.paths[0].name, 'Lộ trình tiêu chuẩn');
  });

  it('localises catalog, roadmap explanations and errors', async () => {
    const meta = (await call('GET', '/catalog/meta')).body;
    assert.ok(meta.careers.some((c: any) => c.name === 'Kỹ sư AI'));
    assert.equal(meta.majors.find((m: any) => m.name === 'Physics').label, 'Vật lý');

    const wrong = await call('POST', '/auth/login', { body: { email: DEMO_USER.email, password: 'wrong-password' } });
    assert.equal(wrong.body.error, 'Email hoặc mật khẩu không đúng');

    const login = await call('POST', '/auth/login', { body: { email: DEMO_USER.email, password: DEMO_USER.password } });
    const rm = (await call('GET', '/roadmap', { token: login.body.token })).body.roadmap;
    assert.equal(rm.career.name, 'Kỹ sư AI');
    const ml = rm.items.find((i: any) => i.course.code === 'ML201');
    assert.equal(ml.course.title, 'Nền tảng học máy');
    assert.match(ml.explanation.headline, /Học phần này được đề xuất vì Học máy là kỹ năng cốt lõi của Kỹ sư AI/);
    assert.match(ml.reason, /^Lấp khoảng trống Học máy/);

    // The same data in English for the same user.
    const enRm = (await call('GET', '/roadmap', { token: login.body.token, lang: 'en' })).body.roadmap;
    assert.match(enRm.items.find((i: any) => i.course.code === 'ML201').explanation.headline, /^This course is recommended because Machine Learning/);
  });

  it('PathGPT understands and answers Vietnamese questions', async () => {
    const login = await call('POST', '/auth/login', { body: { email: DEMO_USER.email, password: DEMO_USER.password } });
    const ask = async (message: string) => (await call('POST', '/assistant/chat', { body: { message }, token: login.body.token })).body.message.content as string;
    assert.match(await ask('Tại sao tôi cần học Đại số tuyến tính?'), /Đại số tuyến tính.*yêu cầu/s);
    assert.match(await ask('Tôi có thể bỏ qua Học máy không?'), /Mình không khuyên bỏ qua/);
    assert.match(await ask('Tôi chỉ có 6 tháng. Nên ưu tiên gì?'), /6 tháng/);
    assert.match(await ask('Tôi muốn chuyển từ Vật lý sang AI. Nên học gì trước?'), /Chuyển từ \*\*Vật lý\*\*/);
    assert.match(await ask('Gợi ý dự án phù hợp với kỹ năng hiện tại của tôi'), /dự án phù hợp nhất/);
    assert.match(await ask('tai sao toi can hoc xac suat'), /Xác suất/);
  });
});
