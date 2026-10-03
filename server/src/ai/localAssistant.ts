/**
 * PathGPT's built-in reasoning engine. It answers from the learner's real data — the deterministic
 * roadmap, skill gaps and project fit — so it works without any external API. When an LLM provider
 * is configured, its analysis is passed along as grounding facts. Answers follow the catalog language.
 */
import { majorLabel } from '../data/majors.js';
import { VI_CATEGORIES } from '../data/vi.js';
import type { EngineContext } from '../engine/context.js';
import { rankProjects } from '../engine/projects.js';
import { analyzeGap, levelOf } from '../engine/skills.js';
import type { Course, GapItem, Skill } from '../engine/types.js';
import { listJoin, type Lang } from '../i18n.js';
import type { RoadmapView } from '../services/roadmapService.js';
import { COURSE_ALIASES, normalize, SKILL_ALIASES, SKILL_WHY, STARTERS, TRANSITION_TIPS } from './knowledge.js';

export type AssistantAction =
  | { type: 'open_course'; code: string; label: string }
  | { type: 'skip_course'; code: string; label: string }
  | { type: 'complete_course'; code: string; label: string }
  | { type: 'set_weekly_hours'; hours: number; label: string }
  | { type: 'navigate'; to: string; label: string };

export interface AssistantReply {
  intent: string;
  text: string;
  actions: AssistantAction[];
  suggestions: string[];
}

export interface AssistantInput {
  ctx: EngineContext;
  view: RoadmapView | null;
}

type Item = RoadmapView['items'][number];

const hoursToWeeks = (h: number, weekly: number) => Math.max(1, Math.ceil(h / Math.max(1, weekly)));

const VI_DIFFICULTY: Record<string, string> = { Beginner: 'Nhập môn', Intermediate: 'Trung cấp', Advanced: 'Nâng cao', Expert: 'Chuyên sâu', Research: 'Nghiên cứu' };

/** All user-facing text of the local engine, per language. */
const TEXT = {
  en: {
    level: (l: string) => l,
    category: (c: string) => c,
    open: (t: string) => `Open ${t}`,
    skip: (t: string) => `Skip ${t}`,
    sug: {
      why: ['Why do I need Linear Algebra?', 'Why is Probability & Statistics in my roadmap?'],
      skipExamples: ['Can I skip Machine Learning?', 'Can I skip Data Structures & Algorithms?'],
      canSkip: (n: string) => `Can I skip ${n}?`,
      whyNeed: (n: string) => `Why do I need ${n}?`,
      next: 'What should I learn next?',
      sixMonths: 'I only have 6 months. What should I prioritize?',
      project: 'Suggest a project based on my current skills.',
      progress: 'How long until I finish my roadmap?',
      safeSkip: 'Can I skip any course safely?',
      eachCourse: 'Why is each course in my roadmap?',
    },
    why: {
      ask: (goal: string) => `Tell me which skill or course you're curious about — for example *"Why do I need Linear Algebra?"* — and I'll explain how it connects to ${goal}.`,
      importance: (w: number) => (w >= 0.9 ? 'a **core** requirement' : w >= 0.7 ? 'a **key** requirement' : 'a **supporting** skill'),
      target: (n: string, imp: string, goal: string, req: number, cur: number) => `**${n}** is ${imp} for **${goal}** — the target is **${req}%** and you're at **${cur}%**.`,
      notTarget: (n: string, goal: string) => `**${n}** isn't a direct requirement for **${goal}**, but it shows up as groundwork for other courses.`,
      deps: (t: string, shown: string) => `In your roadmap, **${t}** is a prerequisite for ${shown} — skipping it would leave those courses without their foundation.`,
      more: (first: string, n: number) => `${first} and ${n} more`,
      met: "Good news: you already meet this requirement, so it won't take extra time in your plan.",
    },
    skipA: {
      ask: 'Which course would you like to skip? Name it (for example *"Can I skip Machine Learning?"*) and I\'ll check what depends on it.',
      completed: (t: string) => `You've already completed **${t}**, so there's nothing to skip — it already counts toward your skills.`,
      notInRoadmap: (t: string, goal: string) => `**${t}** isn't in your current roadmap, so it isn't costing you any time. Your roadmap only contains courses that close a gap for **${goal}** or unlock one that does.`,
      mastered: (t: string, h: number, w: number) => `**Yes.** Your current levels already cover what **${t}** teaches, so skipping it is safe and saves about **${h} h** (~${w} weeks).`,
      dont: (s: string, req: number, goal: string, cur: number) => `**I wouldn't skip it.** ${s} is required at **${req}%** for **${goal}** and you're at **${cur}%**.`,
      unlocks: (list: string) => `It also unlocks ${list}. Skipping it would remove the foundation those courses build on.`,
      elsewhere: "If you've already learned this material elsewhere (a MOOC, another university course), mark it as **completed** instead — your skill levels will update and the next courses unlock.",
      markDone: 'I already know this — mark completed',
      careful: (t: string, list: string) => `**You can, with care.** ${t} is a prerequisite for ${list}. If you skip it, those courses unlock, but you'll need to pick up its material as you go.`,
      saves: (h: number, w: number) => `It would save about **${h} h** (~${w} weeks).`,
      gapStays: (s: string, cur: number, req: number, goal: string) => `Your ${s} would stay at ${cur}% against the ${req}% target, which leaves a visible gap in your ${goal} profile.`,
      noDeps: 'Nothing else in your roadmap depends on it.',
      can: (impact: string, h: number, w: number) => `**You can.** ${impact} Skipping it saves about **${h} h** (~${w} weeks).`,
    },
    time: {
      label: (n: number, unit: 'month' | 'week') => `${n} ${unit}${n === 1 ? '' : 's'}`,
      nothing: 'Your roadmap has nothing left to schedule — time to focus on projects and your portfolio!',
      seeProjects: 'See projects',
      openRoadmap: 'Open my roadmap',
      enough: (label: string, weekly: number, cap: number, rem: number) => `With **${label}** at **${weekly} h/week** you have about **${cap} hours** — enough for your whole remaining roadmap (**${rem} h**). Keep the current order; it already respects every prerequisite.`,
      intro: (label: string, weekly: number, cap: number, rem: number) => `With **${label}** at **${weekly} h/week** you have about **${cap} hours**, but your remaining roadmap needs **${rem} h**. Here's what I'd prioritise — the courses that close your largest gaps, plus the prerequisites they depend on:`,
      item: (n: number, t: string, h: number, reason: string) => `${n}. **${t}** · ${h} h — ${reason}`,
      none: '_Even the first course does not fit — consider adding weekly hours._',
      later: (list: string) => `**Postpone for later:** ${list}.`,
      needed: (label: string, n: number) => `To finish everything in ${label} you'd need about **${n} h/week**.`,
      setPace: (n: number) => `Set my pace to ${n} h/week`,
    },
    transition: {
      fallbackMajor: 'your current field',
      intro: (m: string, g: string) => `Moving from **${m}** to **${g}** — here's how your background maps onto the target:`,
      strong: (list: string) => `**Already strong:** ${list}. These requirements are met, so the roadmap doesn't spend time on them.`,
      gaps: (list: string) => `**Biggest gaps:** ${list}.`,
      first: 'Learn first:',
      start: (t: string) => `Start with ${t}`,
      seeGap: 'See my skill gap',
    },
    project: {
      early: (t: string, level: string, courses: string) => `You're early in the roadmap, so most projects are a stretch right now. A good first target is **${t}** (${level}) — finish ${courses} and you'll be ready.`,
      finishFirst: "Finish your current course first and I'll suggest a project.",
      browse: 'Browse projects',
      intro: 'Based on your current skills, these projects fit best:',
      item: (i: number, t: string, level: string, r: number) => `${i}. **${t}** · ${level} · ${r}% ready`,
      missing: (list: string) => `_To be fully ready:_ ${list}`,
      allSet: '_You have every skill it needs — start now._',
      outro: 'Pick one, keep it small, and publish it with a clear README — that is what recruiters and supervisors actually look at.',
      open: 'Open project recommendations',
    },
    next: {
      allDone: 'Everything in your roadmap is completed or skipped — great work! Regenerate your roadmap or pick a project next.',
      noGoal: "Set a career goal first and I'll build your roadmap.",
      chooseGoal: 'Choose a goal',
      focus: (t: string, d: string, h: number) => `Your current focus is **${t}** (${d}, ${h} h).`,
      after: (t: string, r: string) => `After that comes **${t}** — ${r}.`,
    },
    progress: {
      none: "You don't have a roadmap yet — choose a career goal to generate one.",
      summary: (pct: number, path: string, career: string, c: number, t: number, ch: number, th: number) => `You're **${pct}%** through your **${path}** for **${career}** — ${c} of ${t} courses (${ch} of ${th} hours).`,
      eta: (weekly: number, rh: number, w: number, date: string) => `At **${weekly} h/week**, the remaining **${rh} h** take about **${w} weeks** — you'd finish around **${date}**.`,
      done: 'Every course is done — time to focus on projects and applications!',
      weakest: (cat: string, pct: number) => `The area with the most work left is **${cat}** (${pct}% done).`,
      open: 'Open dashboard',
      locale: 'en-GB',
    },
    career: {
      skills: 'Key skills:',
      skill: (n: string, req: number, cur: number) => `- **${n}** — ${req}% required · you: ${cur}%`,
      isGoal: 'This is your current goal, so your roadmap already targets these.',
      explore: 'Open it in the Career Explorer to see the roadmap you would get.',
      action: (n: string) => `Explore ${n}`,
    },
    help: {
      hi: (name: string, career: string | null, current: string | null) =>
        `Hi ${name}! I'm **PathGPT**. I can see your profile${career ? `, your **${career}** goal` : ''} and your roadmap${current ? ` (current focus: **${current}**)` : ''}.`,
      examples: 'Ask me things like:\n- *Why do I need Linear Algebra?*\n- *Can I skip Machine Learning?*\n- *I only have 6 months. What should I prioritize?*\n- *I want to move from Physics to AI. What should I learn first?*\n- *Suggest a project based on my current skills.*',
      engine: 'Your roadmap itself comes from a deterministic engine (skills → courses → prerequisites); I explain it and help you adjust it.',
      there: 'there',
    },
  },
  vi: {
    level: (l: string) => VI_DIFFICULTY[l] ?? l,
    category: (c: string) => VI_CATEGORIES[c] ?? c,
    open: (t: string) => `Mở ${t}`,
    skip: (t: string) => `Bỏ qua ${t}`,
    sug: {
      why: ['Tại sao tôi cần học Đại số tuyến tính?', 'Tại sao Xác suất thống kê có trong lộ trình của tôi?'],
      skipExamples: ['Tôi có thể bỏ qua Học máy không?', 'Tôi có thể bỏ qua Cấu trúc dữ liệu và giải thuật không?'],
      canSkip: (n: string) => `Tôi có thể bỏ qua ${n} không?`,
      whyNeed: (n: string) => `Tại sao tôi cần học ${n}?`,
      next: 'Tôi nên học gì tiếp theo?',
      sixMonths: 'Tôi chỉ có 6 tháng. Nên ưu tiên gì?',
      project: 'Gợi ý dự án phù hợp với kỹ năng hiện tại của tôi.',
      progress: 'Bao lâu nữa tôi hoàn thành lộ trình?',
      safeSkip: 'Tôi có thể bỏ qua học phần nào an toàn?',
      eachCourse: 'Vì sao mỗi học phần có trong lộ trình của tôi?',
    },
    why: {
      ask: (goal: string) => `Hãy cho mình biết kỹ năng hoặc học phần bạn muốn hỏi — ví dụ *"Tại sao tôi cần học Đại số tuyến tính?"* — mình sẽ giải thích nó liên quan thế nào đến ${goal}.`,
      importance: (w: number) => (w >= 0.9 ? 'yêu cầu **cốt lõi**' : w >= 0.7 ? 'yêu cầu **quan trọng**' : 'kỹ năng **bổ trợ**'),
      target: (n: string, imp: string, goal: string, req: number, cur: number) => `**${n}** là ${imp} của **${goal}** — mục tiêu là **${req}%**, hiện bạn đạt **${cur}%**.`,
      notTarget: (n: string, goal: string) => `**${n}** không phải yêu cầu trực tiếp của **${goal}**, nhưng là nền tảng cho các học phần khác.`,
      deps: (t: string, shown: string) => `Trong lộ trình của bạn, **${t}** là học phần tiên quyết của ${shown} — bỏ qua nó sẽ khiến các học phần đó thiếu nền tảng.`,
      more: (first: string, n: number) => `${first} và ${n} học phần khác`,
      met: 'Tin vui: bạn đã đạt yêu cầu này, nên nó không tốn thêm thời gian trong kế hoạch.',
    },
    skipA: {
      ask: 'Bạn muốn bỏ qua học phần nào? Hãy nêu tên (ví dụ *"Tôi có thể bỏ qua Học máy không?"*), mình sẽ kiểm tra những gì phụ thuộc vào nó.',
      completed: (t: string) => `Bạn đã hoàn thành **${t}** rồi, nên không cần bỏ qua — học phần đã được tính vào kỹ năng của bạn.`,
      notInRoadmap: (t: string, goal: string) => `**${t}** không có trong lộ trình hiện tại nên không tốn thời gian của bạn. Lộ trình chỉ gồm các học phần lấp khoảng trống kỹ năng cho **${goal}** hoặc mở khóa học phần làm điều đó.`,
      mastered: (t: string, h: number, w: number) => `**Được.** Trình độ hiện tại của bạn đã bao quát nội dung **${t}**, nên bỏ qua là an toàn và tiết kiệm khoảng **${h} giờ** (~${w} tuần).`,
      dont: (s: string, req: number, goal: string, cur: number) => `**Mình không khuyên bỏ qua.** **${goal}** yêu cầu ${s} ở mức **${req}%**, hiện bạn đạt **${cur}%**.`,
      unlocks: (list: string) => `Học phần này còn mở khóa ${list}. Bỏ qua sẽ làm mất nền tảng mà các học phần đó dựa vào.`,
      elsewhere: 'Nếu bạn đã học nội dung này ở nơi khác (khóa học trực tuyến, học phần ở trường khác), hãy đánh dấu **đã hoàn thành** — kỹ năng của bạn sẽ được cập nhật và các học phần tiếp theo sẽ mở khóa.',
      markDone: 'Tôi đã biết nội dung này — đánh dấu hoàn thành',
      careful: (t: string, list: string) => `**Có thể, nhưng cần cẩn thận.** ${t} là tiên quyết của ${list}. Nếu bỏ qua, các học phần đó sẽ mở khóa nhưng bạn cần tự bổ sung kiến thức trong quá trình học.`,
      saves: (h: number, w: number) => `Bạn sẽ tiết kiệm khoảng **${h} giờ** (~${w} tuần).`,
      gapStays: (s: string, cur: number, req: number, goal: string) => `${s} của bạn sẽ dừng ở ${cur}% so với mục tiêu ${req}%, để lại khoảng trống rõ ràng trong hồ sơ ${goal}.`,
      noDeps: 'Không có học phần nào khác trong lộ trình phụ thuộc vào nó.',
      can: (impact: string, h: number, w: number) => `**Được.** ${impact} Bỏ qua sẽ tiết kiệm khoảng **${h} giờ** (~${w} tuần).`,
    },
    time: {
      label: (n: number, unit: 'month' | 'week') => `${n} ${unit === 'month' ? 'tháng' : 'tuần'}`,
      nothing: 'Lộ trình của bạn không còn gì cần xếp lịch — đã đến lúc tập trung vào dự án và portfolio!',
      seeProjects: 'Xem dự án',
      openRoadmap: 'Mở lộ trình của tôi',
      enough: (label: string, weekly: number, cap: number, rem: number) => `Với **${label}** và **${weekly} giờ/tuần**, bạn có khoảng **${cap} giờ** — đủ cho toàn bộ phần còn lại của lộ trình (**${rem} giờ**). Hãy giữ thứ tự hiện tại; nó đã tôn trọng mọi điều kiện tiên quyết.`,
      intro: (label: string, weekly: number, cap: number, rem: number) => `Với **${label}** và **${weekly} giờ/tuần**, bạn có khoảng **${cap} giờ**, nhưng phần còn lại của lộ trình cần **${rem} giờ**. Đây là những gì mình sẽ ưu tiên — các học phần lấp khoảng trống lớn nhất, cùng các học phần tiên quyết của chúng:`,
      item: (n: number, t: string, h: number, reason: string) => `${n}. **${t}** · ${h} giờ — ${reason}`,
      none: '_Ngay cả học phần đầu tiên cũng không vừa — hãy cân nhắc tăng số giờ mỗi tuần._',
      later: (list: string) => `**Để sau:** ${list}.`,
      needed: (label: string, n: number) => `Để hoàn thành mọi thứ trong ${label}, bạn cần khoảng **${n} giờ/tuần**.`,
      setPace: (n: number) => `Đặt tốc độ ${n} giờ/tuần`,
    },
    transition: {
      fallbackMajor: 'ngành hiện tại',
      intro: (m: string, g: string) => `Chuyển từ **${m}** sang **${g}** — đây là cách nền tảng của bạn khớp với mục tiêu:`,
      strong: (list: string) => `**Đã vững:** ${list}. Các yêu cầu này đã đạt nên lộ trình không tốn thời gian cho chúng.`,
      gaps: (list: string) => `**Khoảng trống lớn nhất:** ${list}.`,
      first: 'Học trước:',
      start: (t: string) => `Bắt đầu với ${t}`,
      seeGap: 'Xem khoảng trống kỹ năng',
    },
    project: {
      early: (t: string, level: string, courses: string) => `Bạn đang ở giai đoạn đầu của lộ trình nên phần lớn dự án còn hơi sức. Mục tiêu đầu tiên phù hợp là **${t}** (${level}) — hoàn thành ${courses} là bạn sẵn sàng.`,
      finishFirst: 'Hãy hoàn thành học phần hiện tại trước, mình sẽ gợi ý dự án cho bạn.',
      browse: 'Xem các dự án',
      intro: 'Dựa trên kỹ năng hiện tại, đây là các dự án phù hợp nhất:',
      item: (i: number, t: string, level: string, r: number) => `${i}. **${t}** · ${level} · sẵn sàng ${r}%`,
      missing: (list: string) => `_Để sẵn sàng hoàn toàn:_ ${list}`,
      allSet: '_Bạn đã có đủ kỹ năng cần thiết — bắt đầu ngay._',
      outro: 'Hãy chọn một dự án, giữ phạm vi nhỏ và công bố kèm README rõ ràng — đó là điều nhà tuyển dụng và giảng viên hướng dẫn thực sự xem.',
      open: 'Mở gợi ý dự án',
    },
    next: {
      allDone: 'Mọi học phần trong lộ trình đã hoàn thành hoặc bỏ qua — làm tốt lắm! Hãy tạo lại lộ trình hoặc chọn một dự án tiếp theo.',
      noGoal: 'Hãy đặt mục tiêu nghề nghiệp trước, mình sẽ xây dựng lộ trình cho bạn.',
      chooseGoal: 'Chọn mục tiêu',
      focus: (t: string, d: string, h: number) => `Trọng tâm hiện tại của bạn là **${t}** (${d}, ${h} giờ).`,
      after: (t: string, r: string) => `Sau đó là **${t}** — ${r}.`,
    },
    progress: {
      none: 'Bạn chưa có lộ trình — hãy chọn mục tiêu nghề nghiệp để tạo.',
      summary: (pct: number, path: string, career: string, c: number, t: number, ch: number, th: number) => `Bạn đã hoàn thành **${pct}%** ${path} để trở thành **${career}** — ${c}/${t} học phần (${ch}/${th} giờ).`,
      eta: (weekly: number, rh: number, w: number, date: string) => `Với **${weekly} giờ/tuần**, **${rh} giờ** còn lại mất khoảng **${w} tuần** — bạn sẽ hoàn thành vào khoảng **${date}**.`,
      done: 'Mọi học phần đã xong — đến lúc tập trung vào dự án và ứng tuyển!',
      weakest: (cat: string, pct: number) => `Mảng còn nhiều việc nhất là **${cat}** (đã xong ${pct}%).`,
      open: 'Mở bảng điều khiển',
      locale: 'vi-VN',
    },
    career: {
      skills: 'Kỹ năng chính:',
      skill: (n: string, req: number, cur: number) => `- **${n}** — yêu cầu ${req}% · bạn: ${cur}%`,
      isGoal: 'Đây là mục tiêu hiện tại của bạn, nên lộ trình đã nhắm tới các kỹ năng này.',
      explore: 'Mở trong Khám phá nghề nghiệp để xem lộ trình bạn sẽ nhận được.',
      action: (n: string) => `Khám phá ${n}`,
    },
    help: {
      hi: (name: string, career: string | null, current: string | null) =>
        `Chào ${name}! Mình là **PathGPT**. Mình có thể xem hồ sơ${career ? `, mục tiêu **${career}**` : ''} và lộ trình của bạn${current ? ` (trọng tâm hiện tại: **${current}**)` : ''}.`,
      examples: 'Bạn có thể hỏi mình như:\n- *Tại sao tôi cần học Đại số tuyến tính?*\n- *Tôi có thể bỏ qua Học máy không?*\n- *Tôi chỉ có 6 tháng. Nên ưu tiên gì?*\n- *Tôi muốn chuyển từ Vật lý sang AI. Nên học gì trước?*\n- *Gợi ý dự án phù hợp với kỹ năng hiện tại của tôi.*',
      engine: 'Bản thân lộ trình được tạo bởi một bộ máy tất định (kỹ năng → học phần → tiên quyết); mình giải thích và giúp bạn điều chỉnh nó.',
      there: 'bạn',
    },
  },
} satisfies Record<Lang, unknown>;

const text = (input: AssistantInput) => TEXT[input.ctx.cat.lang];
const join = (input: AssistantInput, xs: string[]) => listJoin(input.ctx.cat.lang, xs);

/** Finds the skills and courses a message refers to. */
export function findEntities(ctx: EngineContext, message: string): { skills: Skill[]; courses: Course[] } {
  const msg = normalize(message);
  const courses: Course[] = [];
  const skills: Skill[] = [];
  for (const c of ctx.cat.courseList) {
    if (msg.includes(` ${c.code.toLowerCase()} `) || msg.includes(normalize(c.title).trim())) courses.push(c);
  }
  for (const [re, code] of COURSE_ALIASES) {
    const c = ctx.cat.coursesByCode.get(code);
    if (c && re.test(msg) && !courses.includes(c)) courses.push(c);
  }
  for (const [re, slug] of SKILL_ALIASES) {
    const s = ctx.cat.skillsBySlug.get(slug);
    if (s && re.test(msg) && !skills.includes(s)) skills.push(s);
  }
  return { skills, courses };
}

/** The roadmap course that best represents a skill for this learner. */
function courseForSkill(input: AssistantInput, skill: Skill): Course | null {
  const { ctx, view } = input;
  const inRoadmap = view?.items
    .map((i) => ctx.cat.courses.get(i.course.id)!)
    .filter((c) => c.skills[0]?.skillId === skill.id || c.skills.some((s) => s.skillId === skill.id && s.gain >= 50));
  if (inRoadmap?.length) return inRoadmap.find((c) => !ctx.profile.completed.has(c.id)) ?? inRoadmap[0];
  const candidates = ctx.cat.courseList.filter((c) => c.kind === 'course' && c.skills[0]?.skillId === skill.id);
  return candidates.sort((a, b) => (a.skills[0].gain - b.skills[0].gain) || a.hours - b.hours)[0] ?? null;
}

/** Every roadmap course that (transitively) depends on `courseId`. */
function downstream(input: AssistantInput, courseId: number): Item[] {
  const { ctx, view } = input;
  if (!view) return [];
  const inRoadmap = new Map(view.items.map((i) => [i.course.id, i]));
  const seen = new Set<number>();
  const stack = [courseId];
  while (stack.length) {
    const id = stack.pop()!;
    for (const d of ctx.cat.dependents.get(id) ?? []) {
      if (!seen.has(d) && inRoadmap.has(d)) {
        seen.add(d);
        stack.push(d);
      }
    }
  }
  return view.items.filter((i) => seen.has(i.course.id));
}

function gaps(input: AssistantInput): GapItem[] {
  return analyzeGap(input.ctx.targets, input.ctx.levels);
}

function actionable(view: RoadmapView | null): Item[] {
  return view?.items.filter((i) => i.status !== 'completed' && i.status !== 'skipped') ?? [];
}

const goalOf = (input: AssistantInput) => input.ctx.career?.name ?? (input.ctx.cat.lang === 'vi' ? 'mục tiêu của bạn' : 'your goal');
const bold = (s: string) => `**${s}**`;

// ───────────────────────────── intents ─────────────────────────────

function answerWhy(input: AssistantInput, skill: Skill | null, course: Course | null): AssistantReply {
  const { ctx } = input;
  const T = text(input);
  const goal = goalOf(input);
  const subject = course && !skill ? (course.skills[0] ? ctx.cat.skills.get(course.skills[0].skillId)! : null) : skill;
  const theCourse = course ?? (subject ? courseForSkill(input, subject) : null);
  const lines: string[] = [];
  const actions: AssistantAction[] = [];

  if (!subject && !theCourse) return { intent: 'why', text: T.why.ask(goal), actions: [], suggestions: T.sug.why };

  const name = subject?.name ?? theCourse!.title;
  const target = subject ? ctx.targets.get(subject.id) : undefined;
  const current = subject ? levelOf(ctx.levels, subject.id) : 0;
  if (target) lines.push(T.why.target(name, T.why.importance(target.weight), goal, target.required, current));
  else if (subject) lines.push(T.why.notTarget(name, goal));
  if (subject && SKILL_WHY[ctx.cat.lang][subject.slug]) lines.push(SKILL_WHY[ctx.cat.lang][subject.slug]);

  if (theCourse) {
    const deps = downstream(input, theCourse.id);
    if (deps.length) {
      const names = deps.map((d) => bold(d.course.title));
      const shown = names.length > 4 ? T.why.more(names.slice(0, 4).join(', '), names.length - 4) : join(input, names);
      lines.push(T.why.deps(theCourse.title, shown));
    }
    const item = input.view?.items.find((i) => i.course.id === theCourse.id);
    if (item) lines.push(`> ${item.explanation.headline}`);
    actions.push({ type: 'open_course', code: theCourse.code, label: T.open(theCourse.title) });
  }
  if (target && current >= target.required) lines.push(T.why.met);
  return { intent: 'why', text: lines.join('\n\n'), actions, suggestions: [T.sug.canSkip(name), T.sug.next] };
}

function answerSkip(input: AssistantInput, skill: Skill | null, course: Course | null): AssistantReply {
  const { ctx, view } = input;
  const T = text(input);
  const theCourse = course ?? (skill ? courseForSkill(input, skill) : null);
  if (!theCourse) return { intent: 'skip', text: T.skipA.ask, actions: [], suggestions: T.sug.skipExamples };

  const item = view?.items.find((i) => i.course.id === theCourse.id);
  const goal = goalOf(input);
  const open: AssistantAction = { type: 'open_course', code: theCourse.code, label: T.open(theCourse.title) };
  if (ctx.profile.completed.has(theCourse.id)) return { intent: 'skip', text: T.skipA.completed(theCourse.title), actions: [open], suggestions: [T.sug.next] };
  if (!item) return { intent: 'skip', text: T.skipA.notInRoadmap(theCourse.title, goal), actions: [open], suggestions: [T.sug.eachCourse, T.sug.next] };

  const mainSkill = ctx.cat.skills.get(theCourse.skills[0]?.skillId ?? -1);
  const target = mainSkill ? ctx.targets.get(mainSkill.id) : undefined;
  const current = mainSkill ? levelOf(ctx.levels, mainSkill.id) : 0;
  const deps = downstream(input, theCourse.id).filter((d) => d.status !== 'completed');
  const weeks = hoursToWeeks(theCourse.hours, ctx.profile.weeklyHours);
  const lines: string[] = [];
  const actions: AssistantAction[] = [open];
  const mastered = theCourse.skills.every((s) => levelOf(ctx.levels, s.skillId) >= s.gain);
  const depList = (n: number) => join(input, deps.slice(0, n).map((d) => bold(d.course.title)));

  if (mastered) {
    lines.push(T.skipA.mastered(theCourse.title, theCourse.hours, weeks));
    actions.unshift({ type: 'skip_course', code: theCourse.code, label: T.skip(theCourse.title) });
  } else if (deps.length && target && target.weight >= 0.7) {
    lines.push(T.skipA.dont(mainSkill!.name, target.required, goal, current), T.skipA.unlocks(depList(4)), T.skipA.elsewhere);
    actions.unshift({ type: 'complete_course', code: theCourse.code, label: T.skipA.markDone });
  } else if (deps.length) {
    lines.push(T.skipA.careful(theCourse.title, depList(3)), T.skipA.saves(theCourse.hours, weeks));
    actions.unshift({ type: 'skip_course', code: theCourse.code, label: T.skip(theCourse.title) });
  } else {
    const impact = target && current < target.required ? T.skipA.gapStays(mainSkill!.name, current, target.required, goal) : T.skipA.noDeps;
    lines.push(T.skipA.can(impact, theCourse.hours, weeks));
    actions.unshift({ type: 'skip_course', code: theCourse.code, label: T.skip(theCourse.title) });
  }
  return { intent: 'skip', text: lines.join('\n\n'), actions, suggestions: [T.sug.whyNeed(mainSkill?.name ?? theCourse.title), T.sug.sixMonths] };
}

function answerTime(input: AssistantInput, amount: number, unit: 'month' | 'week'): AssistantReply {
  const { ctx, view } = input;
  const T = text(input);
  const weekly = ctx.profile.weeklyHours;
  const weeks = unit === 'month' ? amount * 4.345 : amount;
  const capacity = Math.round(weeks * weekly);
  const todo = actionable(view);
  const remaining = todo.reduce((s, i) => s + i.course.hours, 0);
  const label = T.time.label(amount, unit);

  if (!view || !todo.length) {
    return { intent: 'time', text: T.time.nothing, actions: [{ type: 'navigate', to: '/projects', label: T.time.seeProjects }], suggestions: [T.sug.project] };
  }
  if (capacity >= remaining) {
    return { intent: 'time', text: T.time.enough(label, weekly, capacity, remaining), actions: [{ type: 'navigate', to: '/roadmap', label: T.time.openRoadmap }], suggestions: [T.sug.project] };
  }

  // Greedy by priority, pulling in unmet prerequisites so the plan stays valid.
  const byId = new Map(todo.map((i) => [i.course.id, i]));
  const chosen = new Set<number>();
  let used = 0;
  const closure = (id: number, acc: Set<number>) => {
    if (acc.has(id) || chosen.has(id) || !byId.has(id)) return;
    acc.add(id);
    for (const p of ctx.cat.courses.get(id)!.prereqIds) closure(p, acc);
  };
  // Only goal courses are candidates; prerequisites come in through the closure of a course that needs them.
  const targets = todo.filter((i) => i.origin !== 'prerequisite');
  for (const item of [...targets].sort((a, b) => b.priority - a.priority || a.position - b.position)) {
    const set = new Set<number>();
    closure(item.course.id, set);
    const cost = [...set].reduce((s, id) => s + byId.get(id)!.course.hours, 0);
    if (set.size && used + cost <= capacity) {
      for (const id of set) chosen.add(id);
      used += cost;
    }
  }
  const keep = todo.filter((i) => chosen.has(i.course.id));
  const later = todo.filter((i) => !chosen.has(i.course.id));
  const needed = Math.ceil(remaining / weeks);

  const lines = [
    T.time.intro(label, weekly, capacity, remaining),
    keep.map((i, n) => T.time.item(n + 1, i.course.title, i.course.hours, i.reason)).join('\n') || T.time.none,
    later.length ? T.time.later(join(input, later.map((i) => i.course.title))) : '',
    T.time.needed(label, needed),
  ].filter(Boolean);
  const actions: AssistantAction[] = [{ type: 'navigate', to: '/roadmap', label: T.time.openRoadmap }];
  if (needed <= 40 && needed > weekly) actions.unshift({ type: 'set_weekly_hours', hours: needed, label: T.time.setPace(needed) });
  return { intent: 'time', text: lines.join('\n\n'), actions, suggestions: [T.sug.safeSkip, T.sug.next] };
}

function answerTransition(input: AssistantInput): AssistantReply {
  const { ctx, view } = input;
  const T = text(input);
  const lang = ctx.cat.lang;
  const major = ctx.profile.major ? majorLabel(ctx.profile.major, lang) : T.transition.fallbackMajor;
  const g = gaps(input);
  const strengths = g.filter((x) => x.group === 'ready').map((x) => ctx.cat.skills.get(x.skillId)!.name);
  const critical = g.filter((x) => x.group === 'critical').slice(0, 3);
  const steps = actionable(view).slice(0, 3);
  const tips = TRANSITION_TIPS[lang];
  const tip = tips[`${ctx.profile.major}|${ctx.career?.slug}`] ?? tips[`${ctx.profile.major}|*`] ?? tips['*|*'];

  const lines = [T.transition.intro(major, goalOf(input))];
  if (strengths.length) lines.push(T.transition.strong(join(input, strengths)));
  if (critical.length) lines.push(T.transition.gaps(join(input, critical.map((c) => `${ctx.cat.skills.get(c.skillId)!.name} (${c.current}% → ${c.required}%)`))));
  if (steps.length) lines.push(`**${T.transition.first}**\n${steps.map((s, i) => `${i + 1}. **${s.course.title}** — ${s.reason}`).join('\n')}`);
  lines.push(tip);
  return {
    intent: 'transition',
    text: lines.join('\n\n'),
    actions: steps[0] ? [{ type: 'open_course', code: steps[0].course.code, label: T.transition.start(steps[0].course.title) }, { type: 'navigate', to: '/skill-gap', label: T.transition.seeGap }] : [],
    suggestions: [T.sug.why[0], T.sug.sixMonths],
  };
}

function answerProject(input: AssistantInput): AssistantReply {
  const { ctx } = input;
  const T = text(input);
  const ranked = rankProjects(ctx).filter((f) => f.status !== 'future');
  const relevant = ranked.filter((f) => f.relevance > 0);
  const picks = (relevant.length ? relevant : ranked).slice(0, 3);
  if (!picks.length) {
    const first = rankProjects(ctx)[0];
    return {
      intent: 'project',
      text: first
        ? T.project.early(first.project.title, T.level(first.project.level), join(input, first.missingCourseIds.slice(0, 2).map((id) => ctx.cat.courses.get(id)!.title)))
        : T.project.finishFirst,
      actions: [{ type: 'navigate', to: '/projects', label: T.project.browse }],
      suggestions: [T.sug.next],
    };
  }
  const lines = [T.project.intro];
  picks.forEach((f, i) => {
    const missing = f.skills.filter((s) => !s.met).map((s) => `${ctx.cat.skills.get(s.skillId)!.name} ${s.current}%→${s.required}%`);
    lines.push(`${T.project.item(i + 1, f.project.title, T.level(f.project.level), f.readiness)}\n   ${f.project.summary}\n   ${missing.length ? T.project.missing(missing.join(', ')) : T.project.allSet}`);
  });
  lines.push(T.project.outro);
  return { intent: 'project', text: lines.join('\n\n'), actions: [{ type: 'navigate', to: '/projects', label: T.project.open }], suggestions: [T.sug.next, T.sug.progress] };
}

function answerNext(input: AssistantInput): AssistantReply {
  const { view } = input;
  const T = text(input);
  const cur = view?.items.find((i) => i.status === 'current');
  const next = view?.nextCourseId ? view.items.find((i) => i.course.id === view.nextCourseId) : undefined;
  if (!view || !cur) {
    return {
      intent: 'next',
      text: view ? T.next.allDone : T.next.noGoal,
      actions: [{ type: 'navigate', to: view ? '/projects' : '/settings', label: view ? T.time.seeProjects : T.next.chooseGoal }],
      suggestions: STARTERS[input.ctx.cat.lang],
    };
  }
  const lines = [T.next.focus(cur.course.title, T.level(cur.course.difficulty), cur.course.hours), cur.explanation.headline];
  if (next) lines.push(T.next.after(next.course.title, `${next.reason.charAt(0).toLowerCase()}${next.reason.slice(1)}`));
  return {
    intent: 'next',
    text: lines.join('\n\n'),
    actions: [{ type: 'open_course', code: cur.course.code, label: T.open(cur.course.title) }],
    suggestions: [T.sug.whyNeed(cur.course.title), T.sug.canSkip(cur.course.title)],
  };
}

function answerProgress(input: AssistantInput): AssistantReply {
  const { view, ctx } = input;
  const T = text(input);
  if (!view) return { intent: 'progress', text: T.progress.none, actions: [{ type: 'navigate', to: '/settings', label: T.next.chooseGoal }], suggestions: [] };
  const p = view.progress;
  const date = new Date(p.etaDate).toLocaleDateString(T.progress.locale, { month: 'long', year: 'numeric' });
  const lines = [
    T.progress.summary(p.pct, view.path.name, view.career.name, p.completed, p.total, p.completedHours, p.totalHours),
    p.remainingHours > 0 ? T.progress.eta(ctx.profile.weeklyHours, p.remainingHours, p.etaWeeks, date) : T.progress.done,
  ];
  const weakest = [...p.categories].filter((c) => c.pct < 100).sort((a, b) => a.pct - b.pct)[0];
  if (weakest) lines.push(T.progress.weakest(T.category(weakest.category), weakest.pct));
  return { intent: 'progress', text: lines.join('\n\n'), actions: [{ type: 'navigate', to: '/dashboard', label: T.progress.open }], suggestions: [T.sug.sixMonths, T.sug.next] };
}

function answerCareer(input: AssistantInput, message: string): AssistantReply | null {
  const { ctx } = input;
  const T = text(input);
  const msg = normalize(message);
  const career = [...ctx.cat.careers.values()].find((c) => {
    const n = normalize(c.name).trim();
    return msg.includes(n) || msg.includes(n.replace(/ engineer$/, '').replace(/^ky su /, ''));
  });
  if (!career) return null;
  const skills = career.skills.slice(0, 7).map((s) => T.career.skill(ctx.cat.skills.get(s.skillId)!.name, s.required, levelOf(ctx.levels, s.skillId)));
  const isGoal = ctx.career?.id === career.id;
  return {
    intent: 'career',
    text: [`**${career.name}** — ${career.tagline}`, career.description, `**${T.career.skills}**\n${skills.join('\n')}`, isGoal ? T.career.isGoal : T.career.explore].join('\n\n'),
    actions: [{ type: 'navigate', to: `/careers/${career.slug}`, label: T.career.action(career.name) }],
    suggestions: [T.sug.next],
  };
}

function answerHelp(input: AssistantInput): AssistantReply {
  const { ctx, view } = input;
  const T = text(input);
  const name = ctx.profile.fullName.split(' ').pop() || T.help.there;
  const cur = view?.items.find((i) => i.status === 'current');
  return {
    intent: 'help',
    text: [T.help.hi(ctx.cat.lang === 'vi' ? name : ctx.profile.fullName.split(' ')[0] || T.help.there, ctx.career?.name ?? null, cur?.course.title ?? null), T.help.examples, T.help.engine].join('\n\n'),
    actions: [],
    suggestions: STARTERS[ctx.cat.lang],
  };
}

export function localAnswer(input: AssistantInput, message: string): AssistantReply {
  const msg = normalize(message);
  const { skills, courses } = findEntities(input.ctx, message);
  const skill = skills[0] ?? null;
  const course = courses[0] ?? null;

  const time = msg.match(/(\d+(?:[.,]\d+)?)\s*(months?|mo|weeks?|wks?|thang|tuan)\b/);
  if (time && /(have|only|got|left|in|within|deadline|before|priori|chi|con|trong|uu tien|co)/.test(msg)) {
    return answerTime(input, Number(time[1].replace(',', '.')), /^(w|tuan)/.test(time[2]) ? 'week' : 'month');
  }
  if (/\bhalf (a )?year\b|\bnua nam\b/.test(msg)) return answerTime(input, 6, 'month');
  if (/\bwhy\b|\bwhat('s| is) the point\b|\bimportant\b|\bwhat is .* (for|used)\b|\btai sao\b|\bvi sao\b|\bde lam gi\b|\bquan trong\b/.test(msg) && (skill || course)) {
    return answerWhy(input, skill, course);
  }
  if (/\bskip\b|\bdrop\b|\bwithout\b|\bavoid\b|\bdo i (really |actually )?need\b|\bnecessary\b|\bremove\b|\bbo qua\b|\bkhong hoc\b|\bco can\b|\bbat buoc\b|\bbo duoc\b/.test(msg)) {
    return answerSkip(input, skill, course);
  }
  if (/\b(move|moving|switch|switching|transition|transitioning|change|changing|pivot)\b.*\b(from|to|into)\b|\bcoming from\b|\bmy background\b|\bi('m| am) an? .* (student|major)\b|\bchuyen (tu|sang|nganh)\b|\bxuat than\b|\bnen tang cua toi\b|\btoi la sinh vien\b/.test(msg)) {
    return answerTransition(input);
  }
  if (/\bprojects?\b|\bportfolio\b|\bbuild something\b|\bhands[- ]on\b|\bpractice\b|\bdu an\b|\bdo an\b|\bthuc hanh\b/.test(msg)) {
    return answerProject(input);
  }
  if (/\bnext\b|\bwhat should i (learn|study|do|focus)\b|\bwhere (do|should) i start\b|\bfirst\b|\bfocus\b|\bstart\b|\btiep theo\b|\bhoc gi\b|\bbat dau\b|\bnen hoc\b|\btruoc tien\b|\bdau tien\b/.test(msg)) {
    return answerNext(input);
  }
  if (/\bprogress\b|\bhow (long|far|much)\b|\bwhen (will|can|do) i\b|\bfinish\b|\beta\b|\bdone\b|\btien do\b|\bbao lau\b|\bkhi nao\b|\bhoan thanh\b|\bxong\b/.test(msg)) {
    return answerProgress(input);
  }
  const career = answerCareer(input, message);
  if (career) return career;
  if (skill || course) return answerWhy(input, skill, course);
  return answerHelp(input);
}

/** Compact, factual context handed to an LLM so its answer stays grounded in the learner's data. */
export function contextForLlm(input: AssistantInput) {
  const { ctx, view } = input;
  const g = gaps(input);
  return {
    responseLanguage: ctx.cat.lang === 'vi' ? 'Vietnamese' : 'English',
    learner: {
      name: ctx.profile.fullName,
      major: ctx.profile.major,
      yearOfStudy: ctx.profile.yearOfStudy,
      weeklyHours: ctx.profile.weeklyHours,
      careerGoal: ctx.career?.name ?? null,
      researchDirection: ctx.research?.name ?? null,
      roadmapPath: view?.path.name ?? null,
    },
    skillGaps: g.map((x) => ({ skill: ctx.cat.skills.get(x.skillId)!.name, current: x.current, required: x.required, group: x.group, priority: x.priority })),
    roadmap: view?.items.map((i) => ({ code: i.course.code, title: i.course.title, status: i.status, hours: i.course.hours, why: i.reason })) ?? [],
    progress: view ? { pct: view.progress.pct, remainingHours: view.progress.remainingHours, etaWeeks: view.progress.etaWeeks } : null,
    autoSkipped: view?.autoSkipped.map((s) => s.reason) ?? [],
    topProjects: rankProjects(ctx).slice(0, 4).map((f) => ({ title: f.project.title, level: f.project.level, readiness: `${f.readiness}%` })),
  };
}
