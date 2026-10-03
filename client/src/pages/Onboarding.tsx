import { clsx } from 'clsx';
import { ArrowLeft, ArrowRight, BookOpen, Check, CircleCheck, FlaskConical, Gauge, RotateCcw, Search, Sparkles, Target, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/Button';
import { LanguageSwitch } from '../components/ui/LanguageSwitch';
import { LevelSlider } from '../components/ui/LevelSlider';
import { Logo } from '../components/ui/Logo';
import { PageLoader, Segmented } from '../components/ui/primitives';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { msg, useI18n } from '../i18n';
import { api, errorMessage } from '../lib/api';
import { SKILL_GROUPS, levelLabel } from '../lib/format';
import { useApi, useDocumentTitle, useMeta } from '../lib/hooks';
import { DomainIcon } from '../lib/icons';
import type { LibraryCourse, User } from '../lib/types';

const STEPS = [
  { key: 'about', label: msg('About you'), icon: UserRound },
  { key: 'skills', label: msg('Your skills'), icon: Gauge },
  { key: 'courses', label: msg('Completed courses'), icon: BookOpen },
  { key: 'goals', label: msg('Your goal'), icon: Target },
] as const;

const YEARS = ['1', '2', '3', '4', '5'] as const;

export default function Onboarding() {
  const { t } = useI18n();
  useDocumentTitle(t('Set up your profile'));
  const { user, setUser } = useAuth();
  const meta = useMeta();
  const toast = useToast();
  const navigate = useNavigate();
  const { data: courseData } = useApi<{ courses: LibraryCourse[] }>('/catalog/courses');

  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    fullName: user?.fullName ?? '',
    university: user?.university ?? '',
    major: user?.major ?? '',
    yearOfStudy: user?.yearOfStudy ?? 2,
    gpa: user?.gpa != null ? String(user.gpa) : '',
    weeklyHours: user?.weeklyHours ?? 10,
  });
  const [skills, setSkills] = useState<Record<number, number>>({});
  const [skillsTouched, setSkillsTouched] = useState(false);
  const [skillGroup, setSkillGroup] = useState(SKILL_GROUPS[0].key);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [courseQuery, setCourseQuery] = useState('');
  const [careerId, setCareerId] = useState<number | null>(user?.careerId ?? null);
  const [researchId, setResearchId] = useState<number | null>(user?.researchId ?? null);
  const [secondary, setSecondary] = useState<{ careers: number[]; research: number[] }>({ careers: [], research: [] });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const baseline = useMemo(() => meta?.majors.find((m) => m.name === profile.major)?.baseline ?? {}, [meta, profile.major]);

  // Pre-fill typical levels for the chosen major until the student edits a slider.
  useEffect(() => {
    if (!skillsTouched) setSkills(Object.fromEntries(Object.entries(baseline).map(([k, v]) => [Number(k), v])));
  }, [baseline, skillsTouched]);

  if (!meta) return <PageLoader />;

  const majorName = meta.majors.find((m) => m.name === profile.major)?.label ?? profile.major;
  const ratedCount = Object.values(skills).filter((v) => v > 0).length;
  const courses = (courseData?.courses ?? []).filter((c) => c.kind === 'course');
  const q = courseQuery.trim().toLowerCase();
  const filteredCourses = q ? courses.filter((c) => c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || t(c.category).toLowerCase().includes(q)) : courses;
  const byCategory = filteredCourses.reduce<Record<string, LibraryCourse[]>>((acc, c) => ((acc[c.category] ??= []).push(c), acc), {});
  const career = meta.careers.find((c) => c.id === careerId);

  function validate(s: number) {
    const errs: Record<string, string> = {};
    if (s === 0) {
      if (profile.fullName.trim().length < 2) errs.fullName = t('Enter your name');
      if (!profile.major) errs.major = t('Choose your major');
      const gpa = profile.gpa === '' ? null : Number(profile.gpa);
      if (gpa !== null && (Number.isNaN(gpa) || gpa < 0 || gpa > 10)) errs.gpa = t('GPA must be between 0 and 10');
    }
    if (s === 3 && !careerId) errs.career = t('Choose a career goal');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() {
    if (!validate(step)) return;
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function finish() {
    if (!validate(0)) return setStep(0);
    if (!validate(3)) return;
    setSaving(true);
    try {
      const { user: updated } = await api.post<{ user: User }>('/me/onboarding', {
        profile: {
          fullName: profile.fullName.trim(),
          university: profile.university.trim() || null,
          major: profile.major || null,
          yearOfStudy: Number(profile.yearOfStudy),
          gpa: profile.gpa === '' ? null : Number(profile.gpa),
          weeklyHours: profile.weeklyHours,
        },
        skills: Object.entries(skills).map(([skillId, level]) => ({ skillId: Number(skillId), level })),
        completed: [...completed],
        goals: { careerId, researchId, secondaryCareerIds: secondary.careers, secondaryResearchIds: secondary.research },
      });
      setUser(updated);
      toast({ tone: 'success', title: t('Your roadmap is ready'), description: t('Start by reviewing your skill gap.') });
      navigate('/skill-gap', { replace: true });
    } catch (err) {
      toast({ tone: 'error', title: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  const toggle = (list: number[], id: number) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/[0.05] bg-navy-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Logo to="/" />
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-slate-500 sm:inline">{t('Step {n} of {total}', { n: step + 1, total: STEPS.length })}</span>
            <LanguageSwitch />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[240px_1fr] lg:py-12">
        {/* Stepper */}
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <ol className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1">
            {STEPS.map((s, i) => (
              <li key={s.key}>
                <button
                  onClick={() => i < step && setStep(i)}
                  disabled={i > step}
                  className={clsx(
                    'flex w-full items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-sm transition',
                    i === step ? 'bg-white/[0.07] text-white' : i < step ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-600',
                  )}
                >
                  <span className={clsx('flex size-7 shrink-0 items-center justify-center rounded-lg border text-xs', i < step ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : i === step ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-200' : 'border-white/10')}>
                    {i < step ? <Check className="size-3.5" /> : <s.icon className="size-3.5" />}
                  </span>
                  <span className="hidden sm:inline">{t(s.label)}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="mt-6 hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs text-slate-400 lg:block">
            <p className="eyebrow mb-3">{t('Your profile so far')}</p>
            <dl className="space-y-2">
              <div className="flex justify-between gap-2"><dt>{t('Major')}</dt><dd className="truncate text-slate-200">{majorName || '—'}</dd></div>
              <div className="flex justify-between"><dt>{t('Skills rated')}</dt><dd className="text-slate-200">{ratedCount}</dd></div>
              <div className="flex justify-between"><dt>{t('Courses done')}</dt><dd className="text-slate-200">{completed.size}</dd></div>
              <div className="flex justify-between gap-2"><dt>{t('Goal')}</dt><dd className="truncate text-slate-200">{career?.name ?? '—'}</dd></div>
            </dl>
          </div>
        </aside>

        <section className="min-w-0">
          {step === 0 && (
            <div className="animate-fade-up">
              <h1 className="text-2xl font-semibold tracking-tight text-white">{t("Let's start with you")}</h1>
              <p className="mt-1.5 text-sm text-slate-400">{t('Your background shapes which foundations you can skip and how long the roadmap takes.')}</p>
              <div className="card mt-6 grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                <label className="block">
                  <span className="label">{t('Full name')}</span>
                  <input className="input" value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} />
                  {errors.fullName && <span className="mt-1 block text-xs text-rose-300">{errors.fullName}</span>}
                </label>
                <label className="block">
                  <span className="label">{t('University')}</span>
                  <input className="input" value={profile.university} onChange={(e) => setProfile({ ...profile, university: e.target.value })} placeholder={t('e.g. University of Science, VNU-HCM')} />
                </label>
                <label className="block">
                  <span className="label">{t('Major')}</span>
                  <select className="input" value={profile.major} onChange={(e) => setProfile({ ...profile, major: e.target.value })}>
                    <option value="">{t('Select your major…')}</option>
                    {meta.majors.map((m) => <option key={m.name} value={m.name}>{m.label}</option>)}
                  </select>
                  {errors.major && <span className="mt-1 block text-xs text-rose-300">{errors.major}</span>}
                </label>
                <div>
                  <span className="label">{t('Year of study')}</span>
                  <Segmented value={String(profile.yearOfStudy) as (typeof YEARS)[number]} onChange={(v) => setProfile({ ...profile, yearOfStudy: Number(v) })} options={YEARS.map((y) => ({ value: y, label: y === '5' ? '5+' : t('Year {n}', { n: y }) }))} className="w-full justify-between" size="sm" />
                </div>
                <label className="block">
                  <span className="label">{t('GPA')} <span className="text-slate-600">{t('(4.0 or 10-point scale, optional)')}</span></span>
                  <input className="input" inputMode="decimal" value={profile.gpa} onChange={(e) => setProfile({ ...profile, gpa: e.target.value })} placeholder={t('e.g. 3.4')} />
                  {errors.gpa && <span className="mt-1 block text-xs text-rose-300">{errors.gpa}</span>}
                </label>
                <div>
                  <span className="label flex justify-between">{t('Weekly learning time')} <span className="font-mono text-cyan-300">{t('{n} h/week', { n: profile.weeklyHours })}</span></span>
                  <input type="range" min={2} max={40} value={profile.weeklyHours} onChange={(e) => setProfile({ ...profile, weeklyHours: Number(e.target.value) })} className="mt-3 w-full accent-cyan-400" aria-label={t('Weekly learning hours')} />
                  <p className="mt-1 text-xs text-slate-500">{t('A 45-hour course takes about {n} weeks at this pace.', { n: Math.max(1, Math.round(45 / profile.weeklyHours)) })}</p>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="animate-fade-up">
              <h1 className="text-2xl font-semibold tracking-tight text-white">{t('How strong are your skills today?')}</h1>
              <p className="mt-1.5 text-sm text-slate-400">{t('Be honest — the roadmap only skips what you already know. Drag a slider or tap a level.')}</p>
              {profile.major && Object.keys(baseline).length > 0 && (
                <div className="mt-5 flex flex-col gap-3 rounded-xl border border-violet-400/25 bg-violet-400/[0.06] p-3.5 text-sm text-violet-100 sm:flex-row sm:items-center">
                  <Sparkles className="size-4 shrink-0 text-violet-300" />
                  <span className="flex-1">{t("We pre-filled typical levels for a {major} student. Adjust anything that doesn't match you.", { major: majorName })}</span>
                  <Button variant="ghost" size="sm" icon={<RotateCcw className="size-3.5" />} onClick={() => { setSkillsTouched(false); setSkills(Object.fromEntries(Object.entries(baseline).map(([k, v]) => [Number(k), v]))); }}>
                    {t('Reset')}
                  </Button>
                </div>
              )}
              <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                {SKILL_GROUPS.map((g) => {
                  const count = meta.skills.filter((s) => g.categories.includes(s.category) && (skills[s.id] ?? 0) > 0).length;
                  return (
                    <button key={g.key} onClick={() => setSkillGroup(g.key)} className={clsx('whitespace-nowrap rounded-xl border px-3.5 py-2 text-sm transition', skillGroup === g.key ? 'border-cyan-400/50 bg-cyan-400/10 text-white' : 'border-white/10 text-slate-400 hover:text-slate-200')}>
                      {t(g.label)}
                      {count > 0 && <span className="ml-2 rounded-md bg-white/10 px-1.5 text-xs">{count}</span>}
                    </button>
                  );
                })}
              </div>
              {SKILL_GROUPS.filter((g) => g.key === skillGroup).map((g) => (
                <div key={g.key} className="mt-4">
                  <p className="mb-3 text-xs text-slate-500">{t(g.description)}</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {meta.skills.filter((s) => g.categories.includes(s.category)).map((s) => (
                      <LevelSlider
                        key={s.id}
                        name={s.name}
                        description={s.description}
                        value={skills[s.id] ?? 0}
                        onChange={(v) => {
                          setSkillsTouched(true);
                          setSkills((prev) => ({ ...prev, [s.id]: v }));
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-up">
              <h1 className="text-2xl font-semibold tracking-tight text-white">{t('Which courses have you completed?')}</h1>
              <p className="mt-1.5 text-sm text-slate-400">{t('Completed courses count as evidence of their skills — they are skipped in your roadmap and unlock what comes after.')}</p>
              <div className="relative mt-5">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                <input className="input pl-9" value={courseQuery} onChange={(e) => setCourseQuery(e.target.value)} placeholder={t('Search courses, e.g. Calculus or CS101')} />
              </div>
              <p className="mt-3 text-xs text-slate-500">{t('{n} selected', { n: completed.size })}</p>
              <div className="mt-4 space-y-6">
                {Object.entries(byCategory).map(([cat, list]) => (
                  <div key={cat}>
                    <p className="eyebrow mb-2">{t(cat)}</p>
                    <div className="flex flex-wrap gap-2">
                      {list.map((c) => {
                        const on = completed.has(c.id);
                        return (
                          <button
                            key={c.id}
                            onClick={() => setCompleted((prev) => { const n = new Set(prev); if (on) n.delete(c.id); else n.add(c.id); return n; })}
                            className={clsx('inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition', on ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-100' : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/20')}
                          >
                            {on ? <CircleCheck className="size-4 text-emerald-300" /> : <span className="size-4 rounded-full border border-white/20" />}
                            {c.title}
                            <span className="font-mono text-[10px] text-slate-500">{c.code}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {!courseData && <PageLoader />}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-up space-y-8">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white">{t('Where do you want to go?')}</h1>
                <p className="mt-1.5 text-sm text-slate-400">{t('Pick one primary career goal. You can switch at any time — your progress is kept.')}</p>
                {errors.career && <p className="mt-2 text-sm text-rose-300">{errors.career}</p>}
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {meta.careers.map((c) => (
                    <button key={c.id} onClick={() => { setCareerId(c.id); setSecondary((s) => ({ ...s, careers: s.careers.filter((x) => x !== c.id) })); }} className={clsx('relative flex items-start gap-3 rounded-2xl border p-4 text-left transition', careerId === c.id ? 'border-cyan-400/60 bg-cyan-400/[0.08] shadow-[0_0_0_1px_rgb(34_211_238/0.2)]' : 'border-white/[0.07] bg-white/[0.02] hover:border-white/15')}>
                      <span className={clsx('flex size-10 shrink-0 items-center justify-center rounded-xl', careerId === c.id ? 'bg-cyan-400/20 text-cyan-200' : 'bg-white/[0.05] text-slate-300')}>
                        <DomainIcon name={c.icon} className="size-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium text-white">{c.name}</span>
                        <span className="mt-0.5 block text-xs text-slate-400">{c.tagline}</span>
                      </span>
                      {careerId === c.id && <CircleCheck className="absolute right-3 top-3 size-4 text-cyan-300" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-white"><FlaskConical className="size-4 text-fuchsia-300" /> {t('Research direction')}</h2>
                <p className="mt-1 text-sm text-slate-400">{t('Used by the Research Path and to point out courses that match your interests.')}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => setResearchId(null)} className={clsx('rounded-xl border px-3 py-2 text-sm transition', researchId === null ? 'border-fuchsia-400/50 bg-fuchsia-400/10 text-white' : 'border-white/10 text-slate-400 hover:text-slate-200')}>
                    {t('Not sure yet')}
                  </button>
                  {meta.research.map((r) => (
                    <button key={r.id} onClick={() => { setResearchId(r.id); setSecondary((s) => ({ ...s, research: s.research.filter((x) => x !== r.id) })); }} className={clsx('inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition', researchId === r.id ? 'border-fuchsia-400/50 bg-fuchsia-400/10 text-white' : 'border-white/10 text-slate-300 hover:border-white/20')}>
                      <DomainIcon name={r.icon} className="size-4 text-fuchsia-300" />
                      {r.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-white">{t('Secondary interests')} <span className="text-sm font-normal text-slate-500">{t('(optional)')}</span></h2>
                <p className="mt-1 text-sm text-slate-400">{t('They influence which projects we suggest.')}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {meta.careers.filter((c) => c.id !== careerId).map((c) => (
                    <button key={`c${c.id}`} onClick={() => setSecondary((s) => ({ ...s, careers: toggle(s.careers, c.id) }))} className={clsx('rounded-full border px-3 py-1.5 text-xs transition', secondary.careers.includes(c.id) ? 'border-violet-400/50 bg-violet-400/15 text-violet-100' : 'border-white/10 text-slate-400 hover:text-slate-200')}>
                      {c.name}
                    </button>
                  ))}
                  {meta.research.filter((r) => r.id !== researchId).map((r) => (
                    <button key={`r${r.id}`} onClick={() => setSecondary((s) => ({ ...s, research: toggle(s.research, r.id) }))} className={clsx('rounded-full border px-3 py-1.5 text-xs transition', secondary.research.includes(r.id) ? 'border-fuchsia-400/50 bg-fuchsia-400/15 text-fuchsia-100' : 'border-white/10 text-slate-400 hover:text-slate-200')}>
                      {t('{name} research', { name: r.name })}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="sticky bottom-0 mt-10 flex items-center justify-between gap-3 border-t border-white/[0.06] bg-navy-950/85 py-4 backdrop-blur-xl">
            <Button variant="ghost" icon={<ArrowLeft className="size-4" />} onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              {t('Back')}
            </Button>
            {step === 1 && <span className="hidden text-xs text-slate-500 sm:block">{t('{n} skills rated · {level} max', { n: ratedCount, level: t(levelLabel(Math.max(0, ...Object.values(skills)))) })}</span>}
            {step < STEPS.length - 1 ? (
              <Button onClick={next}>
                {t('Continue')} <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button onClick={finish} loading={saving} icon={<Sparkles className="size-4" />}>
                {t('Analyse my skills')}
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
