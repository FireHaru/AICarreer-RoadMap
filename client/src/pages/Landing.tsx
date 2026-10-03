import {
  ArrowRight, Bot, CircleCheck, Compass, FlaskConical, Gauge, GitBranch, Lightbulb, Route, Sparkles, Target, UserRound,
} from 'lucide-react';
import { Link } from 'react-router';
import { HeroRoadmap } from '../components/landing/HeroRoadmap';
import { Footer, PublicNav } from '../components/layout/PublicShell';
import { ButtonLink } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { msg, useI18n } from '../i18n';
import { useDocumentTitle, useMeta } from '../lib/hooks';
import { DomainIcon } from '../lib/icons';

const STEPS = [
  { icon: UserRound, title: msg('Tell us where you are'), text: msg('Major, year, skills and the courses you have already completed — in about three minutes.') },
  { icon: Target, title: msg('Pick a career or research goal'), text: msg('Nine careers and ten research directions, each with explicit skill requirements.') },
  { icon: Gauge, title: msg('See your exact skill gap'), text: msg('Current vs required level for every skill, grouped into critical gaps, skills to improve and skills already ready.') },
  { icon: Route, title: msg('Follow a roadmap that explains itself'), text: msg('A prerequisite graph ordered by your biggest gaps — with a reason behind every single course.') },
];

const ENGINE = [
  msg('Required skills come from your career, path and research direction'),
  msg('Each gap is matched to the most relevant course that closes it'),
  msg('Prerequisites are added — unless you completed or already master them'),
  msg('Courses are ordered by dependency, larger gaps first'),
  msg('Every decision is stored as a reason you can read'),
];

const PATHS = [
  { icon: Route, name: msg('Standard Path'), text: msg('The most direct route to the role.'), seq: [msg('Python'), msg('Math'), msg('ML'), msg('DL'), msg('Capstone')] },
  { icon: FlaskConical, name: msg('Research Path'), text: msg('Adds research methods and your research direction.'), seq: [msg('Python'), msg('Math'), msg('Statistics'), msg('ML'), msg('DL'), msg('Paper'), msg('Research project')] },
  { icon: GitBranch, name: msg('Specialisation'), text: msg('Goes deep on one area, e.g. Computer Vision.'), seq: [msg('Python'), msg('ML'), msg('DL'), msg('CNN'), msg('Image Processing'), msg('CV'), msg('CV project')] },
];

export default function Landing() {
  useDocumentTitle('');
  const meta = useMeta();
  const { user } = useAuth();
  const { t } = useI18n();
  const start = user ? (user.onboarded ? '/roadmap' : '/onboarding') : '/register';

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/[0.07] px-3 py-1 text-xs font-medium text-cyan-200">
                <Sparkles className="size-3.5" /> {t('AI Career & Research Roadmap')}
              </span>
              <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
                {t('Build the')} <span className="text-gradient">{t('right path')}</span> {t('for your future.')}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
                {t('Discover what you need to learn, why you need to learn it, and how each step brings you closer to your career or research goal.')}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink to={start} size="lg" icon={<Route className="size-4" />}>{t('Build My Roadmap')}</ButtonLink>
                <ButtonLink to="/careers" size="lg" variant="secondary" icon={<Compass className="size-4" />}>{t('Explore Careers')}</ButtonLink>
              </div>
              <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-white/[0.06] pt-6">
                {[
                  { k: meta?.courseCount ?? 66, v: t('courses with prerequisites') },
                  { k: meta?.careers.length ?? 9, v: t('careers') },
                  { k: meta?.research.length ?? 10, v: t('research directions') },
                ].map((s) => (
                  <div key={s.v}>
                    <dt className="text-2xl font-semibold text-white">{s.k}</dt>
                    <dd className="mt-1 text-xs leading-snug text-slate-500">{s.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <HeroRoadmap />
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">{t('How it works')}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{t('From where you are to where you want to be')}</h2>
            <p className="mt-4 text-slate-400">{t('Background + skills + goal → skill gap → a personalised, prerequisite-aware roadmap.')}</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="card relative p-6">
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-400/20 to-violet-500/20 text-cyan-200">
                    <s.icon className="size-5" />
                  </span>
                  <span className="font-mono text-xs text-slate-600">0{i + 1}</span>
                </div>
                <h3 className="mt-5 font-semibold text-white">{t(s.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{t(s.text)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Explainability */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="eyebrow">{t('Explainable by design')}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{t('Every recommendation has a reason.')}</h2>
              <p className="mt-4 max-w-lg text-slate-400">
                {t('PathForge is not a list of random courses. A deterministic engine builds your roadmap from structured data — courses, skills, prerequisites, careers and research directions — so the same profile always gets the same, explainable plan.')}
              </p>
              <ul className="mt-6 space-y-3">
                {ENGINE.map((e) => (
                  <li key={e} className="flex items-start gap-3 text-sm text-slate-300">
                    <CircleCheck className="mt-0.5 size-4 shrink-0 text-cyan-300" /> {t(e)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-cyan-400/20 bg-linear-to-br from-cyan-400/[0.07] to-violet-500/[0.08] p-6">
                <p className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Lightbulb className="size-4 text-cyan-300" /> {t('Why is this course recommended?')}
                </p>
                <p className="mt-3 text-[15px] leading-relaxed text-slate-200">
                  {t('This course is recommended because Machine Learning is a core skill for AI Engineer. You already have intermediate Linear Algebra, basic Probability & Statistics and basic Python skills, so this is your next major learning step.')}
                </p>
                <div className="mt-4 grid gap-2 text-sm text-slate-300">
                  <span className="flex items-center gap-2"><Target className="size-4 text-cyan-300" /> {t('Closes your Machine Learning gap: 10% → 75%')}</span>
                  <span className="flex items-center gap-2"><Route className="size-4 text-violet-300" /> {t('Unlocks Deep Learning and MLOps')}</span>
                </div>
              </div>
              <div className="card flex items-start gap-3 p-5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-400/15 text-violet-200"><Bot className="size-5" /></span>
                <div>
                  <p className="text-sm font-medium text-white">{t('PathGPT knows your roadmap')}</p>
                  <p className="mt-1 text-sm text-slate-400">{t('"I only have 6 months — what should I prioritise?" It answers from your real gaps and prerequisites, and can adjust the plan for you.')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Paths */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">{t('Alternative roadmaps')}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">{t('One goal, several ways to get there')}</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {PATHS.map((p) => (
              <div key={p.name} className="card p-6">
                <span className="flex size-9 items-center justify-center rounded-xl bg-white/[0.06] text-cyan-200"><p.icon className="size-4" /></span>
                <h3 className="mt-4 font-semibold text-white">{t(p.name)}</h3>
                <p className="mt-1 text-sm text-slate-400">{t(p.text)}</p>
                <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs text-slate-300">
                  {p.seq.map((s, i) => (
                    <span key={`${s}-${i}`} className="inline-flex items-center gap-1.5">
                      <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5">{t(s)}</span>
                      {i < p.seq.length - 1 && <ArrowRight className="size-3 text-slate-600" />}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Careers */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">{t('Career explorer')}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">{t('Work backwards from the job you want')}</h2>
            </div>
            <Link to="/careers" className="inline-flex items-center gap-1 text-sm text-cyan-300 hover:underline">{t('All careers')} <ArrowRight className="size-4" /></Link>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(meta?.careers ?? []).map((c) => (
              <Link key={c.id} to={`/careers/${c.slug}`} className="card-interactive group flex items-start gap-4 p-5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-cyan-300 transition group-hover:bg-cyan-400/15">
                  <DomainIcon name={c.icon} className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-white">{c.name}</p>
                  <p className="mt-0.5 text-sm text-slate-400">{c.tagline}</p>
                  <p className="mt-2 truncate text-xs text-slate-500">{c.topSkills.join(' · ')}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-linear-to-br from-cyan-400/10 via-navy-850 to-violet-500/15 px-6 py-14 text-center sm:px-12">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{t('Your roadmap is three minutes away.')}</h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-300">{t('Tell PathForge where you are and where you want to go. It will show you every step in between — and why.')}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink to={start} size="lg">{t('Build My Roadmap')}</ButtonLink>
              <ButtonLink to="/login" size="lg" variant="secondary">{t('Try the demo account')}</ButtonLink>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
