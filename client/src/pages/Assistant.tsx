import { clsx } from 'clsx';
import { ArrowRight, Bot, CircleCheck, ExternalLink, Eraser, Send, SkipForward, Sparkles, Timer } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { CourseDrawer } from '../components/course/CourseDrawer';
import { Markdown } from '../components/ui/Markdown';
import { Card, PageLoader } from '../components/ui/primitives';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { msg, useI18n } from '../i18n';
import { api, errorMessage } from '../lib/api';
import { firstName } from '../lib/format';
import { useApi, useDocumentTitle, useMeta } from '../lib/hooks';
import type { AssistantAction, ChatMessage, Dashboard, RoadmapMutation } from '../lib/types';

const STARTERS = [
  msg('Why do I need Linear Algebra?'),
  msg('Can I skip Machine Learning?'),
  msg('I only have 6 months. What should I prioritize?'),
  msg('I want to move from Physics to AI. What should I learn first?'),
  msg('Suggest a project based on my current skills.'),
];

const ACTION_ICON = { open_course: ExternalLink, skip_course: SkipForward, complete_course: CircleCheck, set_weekly_hours: Timer, navigate: ArrowRight } as const;

export default function Assistant() {
  const { t, lang } = useI18n();
  useDocumentTitle('PathGPT');
  const { user, setUser } = useAuth();
  const meta = useMeta();
  const toast = useToast();
  const navigate = useNavigate();
  const { data: history, loading } = useApi<{ provider: string; messages: ChatMessage[] }>('/assistant/history');
  const { data: dash, reload: reloadDash } = useApi<Dashboard>('/insights/dashboard');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const endRef = useRef<HTMLDivElement>(null);
  const starters = STARTERS.map((s) => t(s));

  useEffect(() => {
    if (history) setMessages(history.messages);
  }, [history]);
  useEffect(() => {
    // Server suggestions are in the language of the last answer; reset them when the language changes.
    setSuggestions(null);
  }, [lang]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || sending) return;
    setInput('');
    setMessages((m) => [...m, { id: `local-${Date.now()}`, role: 'user', content: message }]);
    setSending(true);
    try {
      const res = await api.post<{ message: ChatMessage; suggestions: string[] }>('/assistant/chat', { message });
      setMessages((m) => [...m, res.message]);
      if (res.suggestions.length) setSuggestions(res.suggestions);
    } catch (err) {
      setMessages((m) => [...m, { id: `err-${Date.now()}`, role: 'assistant', content: `**${t("Sorry — I couldn't answer that.")}** ${errorMessage(err)}` }]);
    } finally {
      setSending(false);
    }
  }

  async function runAction(a: AssistantAction, key: string) {
    try {
      switch (a.type) {
        case 'open_course':
          setOpen(a.code);
          return;
        case 'navigate':
          navigate(a.to);
          return;
        case 'skip_course': {
          const m = await api.post<RoadmapMutation>(`/roadmap/courses/${a.code}/skip`, { skipped: true });
          toast({ title: t('Course skipped'), description: m.unlocked.length ? t('Unlocked {list}', { list: m.unlocked.map((u) => u.title).join(', ') }) : undefined });
          break;
        }
        case 'complete_course': {
          const m = await api.post<RoadmapMutation>(`/roadmap/courses/${a.code}/complete`, { completed: true });
          toast({ tone: 'success', title: t('Marked as completed'), description: m.unlocked.length ? t('Unlocked {list}', { list: m.unlocked.map((u) => u.title).join(', ') }) : undefined });
          break;
        }
        case 'set_weekly_hours': {
          await api.put('/roadmap/weekly-hours', { weeklyHours: a.hours });
          if (user) setUser({ ...user, weeklyHours: a.hours });
          toast({ title: t('Pace set to {n} h/week', { n: a.hours }) });
          break;
        }
      }
      setDone((d) => new Set(d).add(key));
      void reloadDash();
    } catch (err) {
      toast({ tone: 'error', title: errorMessage(err) });
    }
  }

  async function clear() {
    await api.del('/assistant/history');
    setMessages([]);
    setSuggestions(null);
  }

  const provider = history?.provider ?? 'local';
  const major = dash?.user.major ? meta?.majors.find((m) => m.name === dash.user.major)?.label ?? dash.user.major : null;

  return (
    <div className="grid gap-5 lg:h-[calc(100vh-4rem)] lg:grid-cols-[1fr_300px]">
      <Card className="flex min-h-[70vh] flex-col overflow-hidden lg:min-h-0">
        <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-cyan-400/25 to-violet-500/30 text-white"><Sparkles className="size-4" /></span>
            <div>
              <h1 className="font-semibold text-white">PathGPT</h1>
              <p className="text-xs text-slate-500">
                {provider === 'local' ? t('Built-in reasoning engine · uses your live roadmap') : t('Powered by {provider} · grounded in your roadmap', { provider: provider === 'gemini' ? 'Gemini' : 'OpenAI' })}
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button onClick={clear} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:bg-white/5 hover:text-slate-300">
              <Eraser className="size-3.5" /> {t('Clear')}
            </button>
          )}
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          {loading && !history ? (
            <PageLoader />
          ) : messages.length === 0 ? (
            <div className="mx-auto flex max-w-lg flex-col items-center py-10 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-cyan-400/20 to-violet-500/25 text-violet-100"><Bot className="size-7" /></span>
              <h2 className="mt-4 text-lg font-semibold text-white">{t('Hi {name} — ask me about your roadmap', { name: user ? firstName(user.fullName, lang) : t('there') })}</h2>
              <p className="mt-2 text-sm text-slate-400">{t('I can see your skills, gaps and roadmap. I explain recommendations, help you prioritise and can adjust the plan — the roadmap itself always comes from the deterministic engine.')}</p>
              <div className="mt-6 grid w-full gap-2">
                {starters.map((s) => (
                  <button key={s} onClick={() => send(s)} className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-left text-sm text-slate-300 transition hover:border-cyan-400/40 hover:text-white">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={clsx('flex gap-3', m.role === 'user' && 'justify-end')}>
                {m.role === 'assistant' && <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-400/15 text-violet-200"><Sparkles className="size-3.5" /></span>}
                <div className={clsx('max-w-[85%]', m.role === 'user' ? 'rounded-2xl rounded-tr-md bg-linear-to-br from-cyan-500/25 to-violet-500/25 px-4 py-2.5 text-sm text-white' : 'min-w-0')}>
                  {m.role === 'user' ? m.content : <Markdown text={m.content} />}
                  {m.role === 'assistant' && m.actions && m.actions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {m.actions.map((a, i) => {
                        const key = `${m.id}-${i}`;
                        const Icon = ACTION_ICON[a.type];
                        const finished = done.has(key);
                        return (
                          <button key={key} disabled={finished} onClick={() => runAction(a, key)} className={clsx('inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition', finished ? 'border-emerald-400/30 text-emerald-300' : 'border-white/10 bg-white/[0.04] text-slate-200 hover:border-cyan-400/40 hover:text-white')}>
                            {finished ? <CircleCheck className="size-3.5" /> : <Icon className="size-3.5" />}
                            {a.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {sending && (
            <div className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-400/15 text-violet-200"><Sparkles className="size-3.5" /></span>
              <div className="flex items-center gap-1 py-2">
                {[0, 1, 2].map((i) => <span key={i} className="size-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${i * 0.15}s` }} />)}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-white/[0.06] p-3 sm:p-4">
          {messages.length > 0 && (
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {(suggestions ?? starters).map((s) => (
                <button key={s} onClick={() => send(s)} disabled={sending} className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400 transition hover:border-cyan-400/40 hover:text-white">
                  {s}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={(e: FormEvent) => { e.preventDefault(); void send(input); }} className="flex gap-2">
            <input className="input h-11" value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('Ask about any course, skill or trade-off…')} maxLength={1000} aria-label={t('Message PathGPT')} />
            <button type="submit" disabled={!input.trim() || sending} className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-r from-cyan-400 to-violet-500 text-navy-950 transition hover:brightness-110 disabled:opacity-40" aria-label={t('Send')}>
              <Send className="size-4" />
            </button>
          </form>
        </div>
      </Card>

      <aside className="space-y-4">
        <Card className="p-5">
          <p className="eyebrow mb-3">{t('What PathGPT sees')}</p>
          {dash?.goal ? (
            <dl className="space-y-3 text-sm">
              <div><dt className="text-xs text-slate-500">{t('Goal')}</dt><dd className="text-slate-100">{dash.goal.career.name} · {dash.goal.path.name}</dd></div>
              {dash.goal.research && <div><dt className="text-xs text-slate-500">{t('Research direction')}</dt><dd className="text-slate-100">{dash.goal.research.name}</dd></div>}
              <div><dt className="text-xs text-slate-500">{t('Background')}</dt><dd className="text-slate-100">{major ?? '—'}{dash.user.yearOfStudy ? `, ${t('year {n}', { n: dash.user.yearOfStudy })}` : ''}</dd></div>
              <div><dt className="text-xs text-slate-500">{t('Progress')}</dt><dd className="text-slate-100">{t('{pct}% · {done}/{total} courses', { pct: dash.progress.pct, done: dash.progress.completed, total: dash.progress.total })}</dd></div>
              <div><dt className="text-xs text-slate-500">{t('Current focus')}</dt><dd className="text-slate-100">{dash.current?.course.title ?? '—'}</dd></div>
              <div><dt className="text-xs text-slate-500">{t('Critical gaps')}</dt><dd className="text-slate-100">{dash.gap.topCritical.join(', ') || t('None')}</dd></div>
              <div><dt className="text-xs text-slate-500">{t('Pace')}</dt><dd className="text-slate-100">{t('{n} h/week', { n: dash.weeklyHours })}</dd></div>
            </dl>
          ) : (
            <PageLoader />
          )}
        </Card>
        <Card className="p-5 text-xs leading-relaxed text-slate-400">
          <p className="mb-1.5 font-medium text-slate-200">{t('How answers are made')}</p>
          {t('The roadmap is computed by a deterministic engine from courses, skills and prerequisites. PathGPT reads that result to explain and adjust it — actions only change your roadmap when you click them.')}
        </Card>
      </aside>

      <CourseDrawer code={open} onClose={() => setOpen(null)} onChanged={() => void reloadDash()} />
    </div>
  );
}
