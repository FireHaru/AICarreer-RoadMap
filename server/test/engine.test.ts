import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

process.env.PGLITE_DIR = 'memory://';

const { initDb, closeDb } = await import('../src/db/client.js');
const { loadCatalog } = await import('../src/engine/catalog.js');
const { generateRoadmap, computeStatuses } = await import('../src/engine/roadmap.js');
const { effectiveLevels, gainOf } = await import('../src/engine/skills.js');
const { emptyProfile } = await import('../src/engine/context.js');

type Catalog = Awaited<ReturnType<typeof loadCatalog>>;
let cat: Catalog;

before(async () => {
  cat = await loadCatalog(await initDb(), true);
});
after(closeDb);

function assertTopological(ids: number[]) {
  const pos = new Map(ids.map((id, i) => [id, i]));
  for (const id of ids) {
    for (const p of cat.courses.get(id)!.prereqIds) {
      if (pos.has(p)) assert.ok(pos.get(p)! < pos.get(id)!, `${cat.courses.get(p)!.code} must come before ${cat.courses.get(id)!.code}`);
    }
  }
}

describe('catalog', () => {
  it('has an acyclic prerequisite graph', () => {
    const state = new Map<number, 'visiting' | 'done'>();
    const visit = (id: number, trail: string[]) => {
      if (state.get(id) === 'done') return;
      assert.notEqual(state.get(id), 'visiting', `cycle: ${trail.join(' → ')}`);
      state.set(id, 'visiting');
      for (const p of cat.courses.get(id)!.prereqIds) visit(p, [...trail, cat.courses.get(p)!.code]);
      state.set(id, 'done');
    };
    for (const c of cat.courseList) visit(c.id, [c.code]);
  });

  it('gives every career three paths', () => {
    for (const c of cat.careers.values()) assert.deepEqual(c.paths.map((p) => p.kind), ['standard', 'research', 'specialization']);
  });
});

describe('roadmap engine', () => {
  it('produces valid, deterministic roadmaps for every career, path and research direction', () => {
    for (const career of cat.careers.values()) {
      for (const research of [null, ...cat.research.values()]) {
        for (const path of career.paths) {
          const profile = { ...emptyProfile(), careerId: career.id, researchId: research?.id ?? null };
          const a = generateRoadmap(cat, profile, path);
          const b = generateRoadmap(cat, profile, path);
          assert.deepEqual(a.items, b.items, 'generation must be deterministic');
          const ids = a.items.map((i) => i.courseId);
          assert.equal(new Set(ids).size, ids.length, 'no duplicates');
          assertTopological(ids);
          for (const m of path.courseIds) assert.ok(ids.includes(m), `${path.name} milestone missing`);
          // Every prerequisite of a planned course is planned too (blank profile: nothing completed or mastered).
          for (const id of ids) for (const p of cat.courses.get(id)!.prereqIds) assert.ok(ids.includes(p));
          // Finishing the roadmap closes every gap that any catalog course can close.
          const done = { ...profile, completed: new Set(ids) };
          const levels = effectiveLevels(cat, done);
          for (const t of a.targets.values()) {
            const attainable = Math.max(0, ...cat.courseList.filter((c) => c.kind === 'course').map((c) => gainOf(c, t.skillId)));
            const reached = levels.get(t.skillId)?.level ?? 0;
            assert.ok(reached >= Math.min(t.required, attainable), `${career.name}/${path.slug}: ${cat.skills.get(t.skillId)!.name} ${reached} < ${t.required}`);
          }
        }
      }
    }
  });

  it('skips completed and already-mastered courses, and keeps completed prerequisites as completed nodes', () => {
    const ai = cat.careersBySlug.get('ai-engineer')!;
    const python = cat.skillsBySlug.get('python')!;
    const cs101 = cat.coursesByCode.get('CS101')!;
    const ma110 = cat.coursesByCode.get('MA110')!;
    const profile = { ...emptyProfile(), careerId: ai.id, selfSkills: new Map([[python.id, 55]]), completed: new Set([ma110.id]) };
    const r = generateRoadmap(cat, profile, ai.paths[0]);
    const ids = r.items.map((i) => i.courseId);
    assert.ok(!ids.includes(cs101.id), 'Python Fundamentals is auto-skipped when Python ≥ its outcome');
    assert.ok(r.autoSkipped.some((s) => s.courseId === cs101.id));
    assert.ok(ids.includes(ma110.id), 'completed prerequisite stays visible');
    assert.equal(computeStatuses(cat, r.items, profile.completed, r.levels).get(ma110.id)!.status, 'completed');
  });

  it('prioritises larger skill gaps and unlocks courses when prerequisites are completed', () => {
    const ai = cat.careersBySlug.get('ai-engineer')!;
    const profile = { ...emptyProfile(), careerId: ai.id };
    const r = generateRoadmap(cat, profile, ai.paths[0]);
    const ml = cat.coursesByCode.get('ML201')!;
    const st1 = computeStatuses(cat, r.items, profile.completed, r.levels);
    assert.equal(st1.get(ml.id)!.status, 'locked');
    assert.equal([...st1.values()].filter((s) => s.status === 'current').length, 1);

    const completed = new Set(ml.prereqIds.flatMap((p) => [p, ...cat.courses.get(p)!.prereqIds]));
    for (const p of [...completed]) for (const pp of cat.courses.get(p)!.prereqIds) completed.add(pp);
    const st2 = computeStatuses(cat, r.items, completed, r.levels);
    assert.ok(['current', 'recommended'].includes(st2.get(ml.id)!.status), 'ML unlocks once its prerequisites are done');
  });
});
