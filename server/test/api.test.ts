import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';

process.env.PGLITE_DIR = 'memory://';
process.env.AI_PROVIDER = '';
process.env.GEMINI_API_KEY = '';
process.env.OPENAI_API_KEY = '';

const { initDb, closeDb } = await import('../src/db/client.js');
const { createApp } = await import('../src/app.js');
const { DEMO_USER } = await import('../src/db/seed.js');

let base = '';
let server: ReturnType<ReturnType<typeof createApp>['listen']>;

async function call(method: string, path: string, body?: unknown, token?: string) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json: any = await res.json();
  return { status: res.status, body: json };
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

describe('auth', () => {
  it('registers, rejects duplicates and bad passwords, and resets passwords', async () => {
    const reg = await call('POST', '/auth/register', { fullName: 'Test Student', email: 'Test@Example.com', password: 'secret123' });
    assert.equal(reg.status, 201);
    assert.equal(reg.body.user.email, 'test@example.com');
    assert.equal(reg.body.user.onboarded, false);

    assert.equal((await call('POST', '/auth/register', { fullName: 'X Y', email: 'test@example.com', password: 'secret123' })).status, 409);
    assert.equal((await call('POST', '/auth/login', { email: 'test@example.com', password: 'wrong-pass' })).status, 401);

    const forgot = await call('POST', '/auth/forgot-password', { email: 'test@example.com' });
    assert.ok(forgot.body.devResetToken, 'dev mode returns the reset token');
    const reset = await call('POST', '/auth/reset-password', { token: forgot.body.devResetToken, password: 'newsecret123' });
    assert.equal(reset.status, 200);
    assert.equal((await call('POST', '/auth/reset-password', { token: forgot.body.devResetToken, password: 'another123' })).status, 400, 'token is single-use');
    assert.equal((await call('POST', '/auth/login', { email: 'test@example.com', password: 'newsecret123' })).status, 200);
    assert.equal((await call('GET', '/roadmap')).status, 401);
  });
});

describe('learner journey', () => {
  let token = '';
  let meta: any;

  it('onboards and generates a roadmap', async () => {
    meta = (await call('GET', '/catalog/meta')).body;
    const reg = await call('POST', '/auth/register', { fullName: 'Minh Physics', email: 'minh@example.com', password: 'secret123' });
    token = reg.body.token;
    const skill = (slug: string) => meta.skills.find((s: any) => s.slug === slug).id;
    const career = meta.careers.find((c: any) => c.slug === 'ai-engineer');
    const onboarding = await call('POST', '/me/onboarding', {
      profile: { fullName: 'Minh Physics', university: 'HCMUS', major: 'Physics', yearOfStudy: 2, gpa: 3.2, weeklyHours: 10 },
      skills: [{ skillId: skill('python'), level: 40 }, { skillId: skill('calculus'), level: 70 }, { skillId: skill('linalg'), level: 70 }],
      completed: [],
      goals: { careerId: career.id, researchId: meta.research[0].id, secondaryCareerIds: [], secondaryResearchIds: [] },
    }, token);
    assert.equal(onboarding.status, 200, JSON.stringify(onboarding.body));
    assert.equal(onboarding.body.user.onboarded, true);

    const { body } = await call('GET', '/roadmap', undefined, token);
    const rm = body.roadmap;
    assert.equal(rm.career.slug, 'ai-engineer');
    assert.ok(rm.items.length >= 6);
    assert.equal(rm.items.filter((i: any) => i.status === 'current').length, 1);
    assert.ok(rm.items.every((i: any) => i.explanation.headline.length > 20), 'every course is explained');
    assert.ok(rm.edges.length > 0);
  });

  it('completing the current course unlocks its dependents', async () => {
    const rm = (await call('GET', '/roadmap', undefined, token)).body.roadmap;
    // Complete courses in order until something unlocks.
    let unlocked: any[] = [];
    for (const item of rm.items) {
      if (item.status === 'completed') continue;
      const r = await call('POST', `/roadmap/courses/${item.course.code}/complete`, { completed: true }, token);
      assert.equal(r.status, 200);
      unlocked = r.body.unlocked;
      if (unlocked.length) break;
    }
    assert.ok(unlocked.length > 0, 'some course should unlock');
    const after = (await call('GET', '/roadmap', undefined, token)).body.roadmap;
    assert.ok(after.progress.pct > 0);
  });

  it('supports skip, add, remove, reorder and weekly hours', async () => {
    let rm = (await call('GET', '/roadmap', undefined, token)).body.roadmap;
    const target = rm.items.find((i: any) => i.status === 'locked' || i.status === 'recommended');
    const skip = await call('POST', `/roadmap/courses/${target.course.code}/skip`, { skipped: true }, token);
    assert.equal(skip.body.roadmap.items.find((i: any) => i.course.id === target.course.id).status, 'skipped');

    const add = await call('POST', '/roadmap/courses', { courseId: 'RB201' }, token);
    assert.equal(add.status, 201, JSON.stringify(add.body));
    const codes = add.body.roadmap.items.map((i: any) => i.course.code);
    assert.ok(codes.includes('RB201'));
    assert.ok(codes.indexOf('MA102') < codes.indexOf('RB201'), 'missing prerequisite added before the course');
    assert.equal((await call('POST', '/roadmap/courses', { courseId: 'RB201' }, token)).status, 409);

    const del = await call('DELETE', '/roadmap/courses/RB201', undefined, token);
    assert.ok(!del.body.roadmap.items.some((i: any) => i.course.code === 'RB201'));

    rm = del.body.roadmap;
    const ml = rm.items.find((i: any) => i.course.code === 'ML201');
    const prereqAbove = rm.items[rm.items.indexOf(ml) - 1];
    const blocked = ml.course.prerequisites.some((p: any) => p.id === prereqAbove.course.id);
    const move = await call('POST', '/roadmap/courses/ML201/move', { direction: 'up' }, token);
    assert.equal(move.status, blocked ? 409 : 200);

    const hours = await call('PUT', '/roadmap/weekly-hours', { weeklyHours: 20 }, token);
    assert.equal(hours.body.roadmap.weeklyHours, 20);

    const paths = await call('GET', '/roadmap/paths', undefined, token);
    assert.equal(paths.body.paths.length, 3);
    const regen = await call('POST', '/roadmap/generate', { pathSlug: 'research' }, token);
    assert.equal(regen.body.roadmap.path.slug, 'research');
  });

  it('serves gap analysis, dashboard, projects, course detail and career explorer', async () => {
    const gap = await call('GET', '/insights/gap', undefined, token);
    assert.equal(gap.status, 200);
    assert.ok(gap.body.items.length > 0);
    assert.ok(['critical', 'improve', 'ready'].every((g) => typeof gap.body.counts[g] === 'number'));

    const dash = await call('GET', '/insights/dashboard', undefined, token);
    assert.equal(dash.status, 200);
    assert.ok(dash.body.progress.total > 0);

    const projects = await call('GET', '/insights/projects', undefined, token);
    assert.ok(projects.body.projects.length > 10);

    const course = await call('GET', '/catalog/courses/DL201', undefined, token);
    assert.ok(course.body.personal.explanation.headline);

    const career = await call('GET', '/catalog/careers/cv-engineer');
    assert.equal(career.status, 200);
    assert.ok(career.body.preview.items.length > 5, 'anonymous explorer still shows a roadmap');
  });

  it('PathGPT answers the example questions from the roadmap context', async () => {
    const ask = async (message: string) => (await call('POST', '/assistant/chat', { message }, token)).body.message;
    assert.match((await ask('Why do I need Linear Algebra?')).content, /Linear Algebra/);
    assert.match((await ask('Can I skip Machine Learning?')).content, /Machine Learning/);
    assert.match((await ask('I only have 6 months. What should I prioritize?')).content, /6 months/);
    assert.match((await ask('I want to move from Physics to AI. What should I learn first?')).content, /Physics/);
    assert.match((await ask('Suggest a project based on my current skills.')).content, /ready/);
    const history = await call('GET', '/assistant/history', undefined, token);
    assert.equal(history.body.messages.length, 10);
  });
});

describe('demo account', () => {
  it('can sign in and has a roadmap with completed courses', async () => {
    const login = await call('POST', '/auth/login', { email: DEMO_USER.email, password: DEMO_USER.password });
    assert.equal(login.status, 200);
    const rm = (await call('GET', '/roadmap', undefined, login.body.token)).body.roadmap;
    assert.ok(rm.items.some((i: any) => i.status === 'completed'));
  });
});
