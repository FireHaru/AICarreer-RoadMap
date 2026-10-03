import { clsx } from 'clsx';
import { BookOpen, CircleCheck, Gauge, KeyRound, Languages, LogOut, RefreshCw, Search, Target, UserRound } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '../components/ui/Button';
import { LanguageSwitch } from '../components/ui/LanguageSwitch';
import { LevelSlider } from '../components/ui/LevelSlider';
import { Card, ErrorState, PageHeader, PageLoader, Segmented } from '../components/ui/primitives';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useI18n } from '../i18n';
import { api, errorMessage } from '../lib/api';
import { SKILL_GROUPS } from '../lib/format';
import { useApi, useDocumentTitle, useMeta } from '../lib/hooks';
import { DomainIcon } from '../lib/icons';
import type { LibraryCourse, User } from '../lib/types';

type Tab = 'profile' | 'skills' | 'courses' | 'goals' | 'account';

interface ProfileData {
  user: User;
  skills: { skillId: number; level: number }[];
  completed: number[];
  secondaryCareerIds: number[];
  secondaryResearchIds: number[];
}

function SaveBar({ onSave, saving, note }: { onSave: () => void; saving: boolean; note?: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-center">
      <p className="text-xs text-slate-500">{note}</p>
      <Button onClick={onSave} loading={saving}>{t('Save changes')}</Button>
    </div>
  );
}

export default function Settings() {
  const { t, tn } = useI18n();
  useDocumentTitle(t('Settings'));
  const { user, setUser, logout } = useAuth();
  const meta = useMeta();
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'profile';
  const { data, error, loading, reload } = useApi<ProfileData>('/me/profile');
  const { data: courseData } = useApi<{ courses: LibraryCourse[] }>(tab === 'courses' ? '/catalog/courses' : null);

  const [profile, setProfile] = useState({ fullName: '', university: '', major: '', yearOfStudy: 1, gpa: '', weeklyHours: 10 });
  const [skills, setSkills] = useState<Record<number, number>>({});
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [goals, setGoals] = useState<{ careerId: number | null; researchId: number | null; secondaryCareerIds: number[]; secondaryResearchIds: number[] }>({ careerId: null, researchId: null, secondaryCareerIds: [], secondaryResearchIds: [] });
  const [group, setGroup] = useState(SKILL_GROUPS[0].key);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState<Tab | null>(null);
  const [dirtySkills, setDirtySkills] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '' });

  const tabs: { value: Tab; label: string; icon: ReactNode }[] = [
    { value: 'profile', label: t('Profile'), icon: <UserRound className="size-3.5" /> },
    { value: 'skills', label: t('Skills'), icon: <Gauge className="size-3.5" /> },
    { value: 'courses', label: t('Courses'), icon: <BookOpen className="size-3.5" /> },
    { value: 'goals', label: t('Goals'), icon: <Target className="size-3.5" /> },
    { value: 'account', label: t('Account'), icon: <KeyRound className="size-3.5" /> },
  ];

  useEffect(() => {
    if (!data) return;
    const u = data.user;
    setProfile({ fullName: u.fullName, university: u.university ?? '', major: u.major ?? '', yearOfStudy: u.yearOfStudy ?? 1, gpa: u.gpa != null ? String(u.gpa) : '', weeklyHours: u.weeklyHours });
    setSkills(Object.fromEntries(data.skills.map((s) => [s.skillId, s.level])));
    setCompleted(new Set(data.completed));
    setGoals({ careerId: u.careerId, researchId: u.researchId, secondaryCareerIds: data.secondaryCareerIds, secondaryResearchIds: data.secondaryResearchIds });
  }, [data]);

  async function save(which: Tab, fn: () => Promise<void>, message: string) {
    setSaving(which);
    try {
      await fn();
      toast({ tone: 'success', title: message });
    } catch (err) {
      toast({ tone: 'error', title: errorMessage(err) });
    } finally {
      setSaving(null);
    }
  }

  async function regenerate() {
    await save('skills', async () => {
      await api.post('/roadmap/generate', {});
      setDirtySkills(false);
    }, t('Roadmap regenerated with your updated profile'));
  }

  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data || !meta) return <PageLoader />;

  const courses = (courseData?.courses ?? []).filter((c) => c.kind === 'course' && (!query || `${c.title} ${c.code}`.toLowerCase().includes(query.toLowerCase())));

  return (
    <div className="max-w-4xl">
      <PageHeader eyebrow={t('Profile & settings')} title={t('Your profile')} description={t('Changes to skills, completed courses or goals feed straight into the recommendation engine.')} />
      <Segmented<Tab> value={tab} onChange={(v) => setParams({ tab: v }, { replace: true })} options={tabs} className="mb-6 max-w-full overflow-x-auto" />

      {tab === 'profile' && (
        <div className="space-y-4">
          <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300"><Languages className="size-4" /></span>
              <div>
                <p className="font-medium text-white">{t('Language')} / Ngôn ngữ</p>
                <p className="mt-0.5 text-sm text-slate-400">{t('Interface, course content, explanations and PathGPT answers.')}</p>
              </div>
            </div>
            <LanguageSwitch full />
          </Card>
          <Card className="p-5 sm:p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block"><span className="label">{t('Full name')}</span><input className="input" value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} /></label>
              <label className="block"><span className="label">{t('University')}</span><input className="input" value={profile.university} onChange={(e) => setProfile({ ...profile, university: e.target.value })} /></label>
              <label className="block">
                <span className="label">{t('Major')}</span>
                <select className="input" value={profile.major} onChange={(e) => setProfile({ ...profile, major: e.target.value })}>
                  <option value="">{t('Select…')}</option>
                  {meta.majors.map((m) => <option key={m.name} value={m.name}>{m.label}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="label">{t('Year of study')}</span>
                <select className="input" value={profile.yearOfStudy} onChange={(e) => setProfile({ ...profile, yearOfStudy: Number(e.target.value) })}>
                  {[1, 2, 3, 4, 5, 6].map((y) => <option key={y} value={y}>{t('Year {n}', { n: y })}</option>)}
                </select>
              </label>
              <label className="block"><span className="label">{t('GPA')}</span><input className="input" inputMode="decimal" value={profile.gpa} onChange={(e) => setProfile({ ...profile, gpa: e.target.value })} /></label>
              <label className="block">
                <span className="label flex justify-between">{t('Weekly learning time')} <span className="font-mono text-cyan-300">{t('{n} h', { n: profile.weeklyHours })}</span></span>
                <input type="range" min={2} max={40} value={profile.weeklyHours} onChange={(e) => setProfile({ ...profile, weeklyHours: Number(e.target.value) })} className="mt-3 w-full accent-cyan-400" />
              </label>
            </div>
            <SaveBar
              saving={saving === 'profile'}
              note={t('Weekly time changes your schedule and estimated finish date.')}
              onSave={() => save('profile', async () => {
                const gpa = profile.gpa === '' ? null : Number(profile.gpa);
                if (gpa !== null && (Number.isNaN(gpa) || gpa < 0 || gpa > 10)) throw new Error(t('GPA must be between 0 and 10'));
                const { user: u } = await api.put<{ user: User }>('/me/profile', { ...profile, university: profile.university || null, major: profile.major || null, gpa });
                setUser(u);
              }, t('Profile saved'))}
            />
          </Card>
        </div>
      )}

      {tab === 'skills' && (
        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {SKILL_GROUPS.map((g) => (
              <button key={g.key} onClick={() => setGroup(g.key)} className={clsx('whitespace-nowrap rounded-xl border px-3 py-1.5 text-sm transition', group === g.key ? 'border-cyan-400/50 bg-cyan-400/10 text-white' : 'border-white/10 text-slate-400 hover:text-slate-200')}>{t(g.label)}</button>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {meta.skills.filter((s) => SKILL_GROUPS.find((g) => g.key === group)!.categories.includes(s.category)).map((s) => (
              <LevelSlider key={s.id} name={s.name} description={s.description} value={skills[s.id] ?? 0} onChange={(v) => setSkills((p) => ({ ...p, [s.id]: v }))} compact />
            ))}
          </div>
          <SaveBar
            saving={saving === 'skills'}
            note={t('Self-reported levels. Completed courses raise a skill automatically.')}
            onSave={() => save('skills', async () => {
              await api.put('/me/skills', { skills: Object.entries(skills).map(([skillId, level]) => ({ skillId: Number(skillId), level })) });
              setDirtySkills(true);
            }, t('Skills saved'))}
          />
          {dirtySkills && (
            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-cyan-400/25 bg-cyan-400/[0.06] p-3.5 text-sm text-cyan-100 sm:flex-row sm:items-center">
              <span className="flex-1">{t('Your skill gap is already updated. Regenerate the roadmap so course selection reflects your new levels.')}</span>
              <Button size="sm" variant="secondary" icon={<RefreshCw className="size-3.5" />} onClick={regenerate}>{t('Regenerate roadmap')}</Button>
            </div>
          )}
        </Card>
      )}

      {tab === 'courses' && (
        <Card className="p-5 sm:p-6">
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <input className="input pl-9" placeholder={t('Search courses')} value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          {!courseData ? <PageLoader /> : (
            <div className="flex flex-wrap gap-2">
              {courses.map((c) => {
                const on = completed.has(c.id);
                return (
                  <button key={c.id} onClick={() => setCompleted((p) => { const n = new Set(p); if (on) n.delete(c.id); else n.add(c.id); return n; })} className={clsx('inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm transition', on ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-100' : 'border-white/10 text-slate-300 hover:border-white/20')}>
                    {on ? <CircleCheck className="size-4 text-emerald-300" /> : <span className="size-4 rounded-full border border-white/20" />}
                    {c.title}
                  </button>
                );
              })}
            </div>
          )}
          <SaveBar saving={saving === 'courses'} note={tn('{n} completed course', '{n} completed courses', completed.size)} onSave={() => save('courses', () => api.put('/me/completed', { courseIds: [...completed] }).then(() => undefined), t('Completed courses saved'))} />
        </Card>
      )}

      {tab === 'goals' && (
        <Card className="space-y-6 p-5 sm:p-6">
          <div>
            <p className="label">{t('Career goal')}</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {meta.careers.map((c) => (
                <button key={c.id} onClick={() => setGoals({ ...goals, careerId: c.id, secondaryCareerIds: goals.secondaryCareerIds.filter((x) => x !== c.id) })} className={clsx('flex items-center gap-2.5 rounded-xl border p-3 text-left text-sm transition', goals.careerId === c.id ? 'border-cyan-400/60 bg-cyan-400/[0.08] text-white' : 'border-white/[0.07] text-slate-300 hover:border-white/15')}>
                  <DomainIcon name={c.icon} className="size-4 text-cyan-300" /> {c.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="label">{t('Research direction')}</p>
            <select className="input max-w-sm" value={goals.researchId ?? ''} onChange={(e) => setGoals({ ...goals, researchId: e.target.value ? Number(e.target.value) : null })}>
              <option value="">{t('Not sure yet')}</option>
              {meta.research.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <p className="label">{t('Secondary interests')}</p>
            <div className="flex flex-wrap gap-2">
              {meta.careers.filter((c) => c.id !== goals.careerId).map((c) => {
                const on = goals.secondaryCareerIds.includes(c.id);
                return <button key={c.id} onClick={() => setGoals({ ...goals, secondaryCareerIds: on ? goals.secondaryCareerIds.filter((x) => x !== c.id) : [...goals.secondaryCareerIds, c.id] })} className={clsx('rounded-full border px-3 py-1 text-xs transition', on ? 'border-violet-400/50 bg-violet-400/15 text-violet-100' : 'border-white/10 text-slate-400')}>{c.name}</button>;
              })}
              {meta.research.filter((r) => r.id !== goals.researchId).map((r) => {
                const on = goals.secondaryResearchIds.includes(r.id);
                return <button key={`r${r.id}`} onClick={() => setGoals({ ...goals, secondaryResearchIds: on ? goals.secondaryResearchIds.filter((x) => x !== r.id) : [...goals.secondaryResearchIds, r.id] })} className={clsx('rounded-full border px-3 py-1 text-xs transition', on ? 'border-fuchsia-400/50 bg-fuchsia-400/15 text-fuchsia-100' : 'border-white/10 text-slate-400')}>{t('{name} research', { name: r.name })}</button>;
              })}
            </div>
          </div>
          <SaveBar
            saving={saving === 'goals'}
            note={t('Saving regenerates your roadmap. Completed courses are always kept.')}
            onSave={() => save('goals', async () => {
              if (!goals.careerId) throw new Error(t('Choose a career goal'));
              const { user: u } = await api.put<{ user: User }>('/me/goals', goals);
              setUser(u);
            }, t('Goals saved — roadmap regenerated'))}
          />
        </Card>
      )}

      {tab === 'account' && (
        <div className="space-y-4">
          <Card className="p-5 sm:p-6">
            <p className="label">{t('Email')}</p>
            <p className="text-sm text-slate-200">{user?.email}</p>
          </Card>
          <Card className="p-5 sm:p-6">
            <h2 className="mb-4 font-semibold text-white">{t('Change password')}</h2>
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                void save('account', async () => {
                  await api.post('/auth/change-password', { currentPassword: pw.current, newPassword: pw.next });
                  setPw({ current: '', next: '' });
                }, t('Password updated'));
              }}
            >
              <label className="block"><span className="label">{t('Current password')}</span><input className="input" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></label>
              <label className="block"><span className="label">{t('New password')}</span><input className="input" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} placeholder={t('At least 8 characters')} /></label>
              <div className="sm:col-span-2"><Button type="submit" loading={saving === 'account'} disabled={!pw.current || pw.next.length < 8}>{t('Update password')}</Button></div>
            </form>
          </Card>
          <Card className="flex items-center justify-between gap-4 p-5 sm:p-6">
            <div>
              <p className="font-medium text-white">{t('Log out')}</p>
              <p className="text-sm text-slate-400">{t('You can log back in at any time.')}</p>
            </div>
            <Button variant="danger" icon={<LogOut className="size-4" />} onClick={() => { logout(); navigate('/'); }}>{t('Log out')}</Button>
          </Card>
        </div>
      )}
    </div>
  );
}
