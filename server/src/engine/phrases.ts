import { listJoin, type Lang } from '../i18n.js';

/** Every sentence the explanation engine can produce, in each supported language. */
export interface Phrases {
  join(items: string[]): string;
  levelWord(level: number): string;
  /** "intermediate Linear Algebra" / "Đại số tuyến tính ở mức trung cấp" */
  skillAtLevel(skill: string, level: number): string;
  importance(weight: number): string;
  goalFallback: string;

  becauseCareer(skill: string, weight: number, career: string): string;
  becauseResearch(skill: string, weight: number, research: string): string;
  becausePath(skill: string, path: string): string;
  buildsSkill(skill: string): string;
  alsoBuilds(skills: string): string;
  completedEvidence(skills: string): string;
  unlocksSentence(courses: string): string;
  milestone(path: string, goal: string): string;
  prerequisiteFor(courses: string, goal: string): string;
  userAdded: string;
  supportsGoal(goal: string): string;
  finishFirst(courses: string, plural: boolean): string;
  noPrereq(isCurrent: boolean): string;
  alreadyHave(levels: string, isCurrent: boolean): string;
  prereqsDone(isCurrent: boolean): string;

  bulletMet(skill: string, cur: number, req: number, source: string): string;
  bulletGap(skill: string, cur: number, gain: number, source: string, req: number): string;
  bulletMilestone(path: string): string;
  bulletUnlocks(courses: string): string;
  bulletRemoved(course: string): string;
  bulletAutoSkipped(course: string, skill: string, level: number): string;
  background(major: string, skills: string): string;
  researchAlso(research: string): string;
  time(hours: number, weeks: number, weekly: number): string;

  outsideCompleted: string;
  outsideMet(skill: string, cur: number, req: number): string;
  outsideRaise(skill: string, cur: number, gain: number, req: number): string;
  outsideMastered: string;
  outsideResearch(research: string): string;
  outsideNoCareer: string;
  outsideHelps(skills: string, count: number, career: string): string;
  outsideNotNeeded(career: string): string;

  autoSkip(course: string, evidence: string): string;
  evidence(skill: string, level: number, gain: number): string;

  shortCloses(skill: string, cur: number, req: number): string;
  shortBuilds(skill: string): string;
  shortMilestone: string;
  shortPrereq(course: string): string;
  shortUser: string;
}

const EN_LEVEL = ['none', 'beginner', 'basic', 'intermediate', 'advanced'];
const VI_LEVEL = ['chưa có', 'nhập môn', 'cơ bản', 'trung cấp', 'nâng cao'];

function levelIndex(level: number) {
  if (level <= 0) return 0;
  if (level <= 30) return 1;
  if (level <= 55) return 2;
  if (level <= 80) return 3;
  return 4;
}

const tier = (w: number) => (w >= 0.9 ? 0 : w >= 0.7 ? 1 : 2);

const en: Phrases = {
  join: (items) => listJoin('en', items),
  levelWord: (l) => EN_LEVEL[levelIndex(l)],
  skillAtLevel: (s, l) => `${EN_LEVEL[levelIndex(l)]} ${s}`,
  importance: (w) => ['core', 'key', 'supporting'][tier(w)],
  goalFallback: 'your goal',

  becauseCareer: (s, w, c) => `This course is recommended because ${s} is a ${en.importance(w)} skill for ${c}.`,
  becauseResearch: (s, w, r) => `This course is recommended because ${s} is a ${en.importance(w)} skill for research in ${r}.`,
  becausePath: (s, p) => `This course is recommended because ${s} is a focus of the ${p}.`,
  buildsSkill: (s) => `This course builds ${s}.`,
  alsoBuilds: (s) => `It also builds ${s}.`,
  completedEvidence: (s) => `You've completed this course, so it now counts as evidence of your ${s} skills.`,
  unlocksSentence: (c) => `It unlocks ${c}.`,
  milestone: (p, g) => `This is the milestone project of your ${p}: it turns what you learn in earlier courses into portfolio evidence for ${g}.`,
  prerequisiteFor: (c, g) => `This course is a prerequisite for ${c}, so it sits on the critical path to ${g}.`,
  userAdded: 'You added this course to your roadmap yourself.',
  supportsGoal: (g) => `This course supports your goal of becoming ${g}.`,
  finishFirst: (c, plural) => `Finish ${c} first — it unlocks automatically once ${plural ? 'they are' : 'that is'} done.`,
  noPrereq: (cur) => (cur ? 'It has no prerequisites, so it is the best place to start.' : 'It has no prerequisites, so you can start it whenever you like.'),
  alreadyHave: (lv, cur) => `You already have ${lv} skills, ${cur ? 'so this is your next major learning step.' : 'so you can start it alongside your current course.'}`,
  prereqsDone: (cur) => (cur ? 'Its prerequisites are done, so this is your next major learning step.' : 'Its prerequisites are done, so you can start it now.'),

  bulletMet: (s, c, r, src) => `${s} target met: ${c}% ≥ ${r}% required for ${src}.`,
  bulletGap: (s, c, g, src, r) => `Closes your ${s} gap: ${c}% → ${g}% (${src} needs ${r}%).`,
  bulletMilestone: (p) => `Milestone of the ${p}.`,
  bulletUnlocks: (c) => `Unlocks ${c}.`,
  bulletRemoved: (c) => `You removed its prerequisite ${c} — make sure you know that material.`,
  bulletAutoSkipped: (c, s, l) => `${c} was skipped automatically: your ${s} (${l}%) already covers it.`,
  background: (m, s) => `Your ${m} background already gives you a head start in ${s}.`,
  researchAlso: (r) => `Also relevant to your research direction: ${r}.`,
  time: (h, w, wk) => `≈${h} h of study — about ${w} week${w === 1 ? '' : 's'} at your ${wk} h/week pace.`,

  outsideCompleted: 'You have completed this course — its skills already count toward your profile.',
  outsideMet: (s, c, r) => `You already meet the ${s} requirement (${c}% ≥ ${r}%).`,
  outsideRaise: (s, c, g, r) => `Would raise ${s} from ${c}% to ${g}% (target ${r}%).`,
  outsideMastered: 'Your current skill levels already cover what this course teaches.',
  outsideResearch: (r) => `Relevant to your research direction: ${r}.`,
  outsideNoCareer: 'Set a career goal to see how this course fits your roadmap.',
  outsideHelps: (s, n, c) => `Not in your roadmap yet, but it can help: ${s} ${n > 1 ? 'are' : 'is'} part of your ${c} goal. Add it if you want to go deeper.`,
  outsideNotNeeded: (c) => `This course isn't needed for your current ${c} roadmap — your plan already covers the skills it would add for that goal.`,

  autoSkip: (c, ev) => `${c} was skipped automatically — your ${ev} already covers what it teaches.`,
  evidence: (s, l, g) => `${s} ${l}% ≥ ${g}%`,

  shortCloses: (s, c, r) => `Closes ${s} gap (${c}% → ${r}%)`,
  shortBuilds: (s) => `Builds ${s}`,
  shortMilestone: 'Path milestone project',
  shortPrereq: (c) => `Prerequisite for ${c}`,
  shortUser: 'Added by you',
};

const vi: Phrases = {
  join: (items) => listJoin('vi', items),
  levelWord: (l) => VI_LEVEL[levelIndex(l)],
  skillAtLevel: (s, l) => `${s} ở mức ${VI_LEVEL[levelIndex(l)]}`,
  importance: (w) => ['cốt lõi', 'quan trọng', 'bổ trợ'][tier(w)],
  goalFallback: 'mục tiêu của bạn',

  becauseCareer: (s, w, c) => `Học phần này được đề xuất vì ${s} là kỹ năng ${vi.importance(w)} của ${c}.`,
  becauseResearch: (s, w, r) => `Học phần này được đề xuất vì ${s} là kỹ năng ${vi.importance(w)} cho nghiên cứu về ${r}.`,
  becausePath: (s, p) => `Học phần này được đề xuất vì ${s} là trọng tâm của ${p}.`,
  buildsSkill: (s) => `Học phần này giúp phát triển ${s}.`,
  alsoBuilds: (s) => `Học phần cũng giúp phát triển ${s}.`,
  completedEvidence: (s) => `Bạn đã hoàn thành học phần này, nên nó được tính là minh chứng cho kỹ năng ${s} của bạn.`,
  unlocksSentence: (c) => `Học phần này mở khóa ${c}.`,
  milestone: (p, g) => `Đây là dự án cột mốc của ${p}: biến những gì bạn học ở các học phần trước thành minh chứng trong portfolio để trở thành ${g}.`,
  prerequisiteFor: (c, g) => `Học phần này là tiên quyết của ${c}, nên nằm trên con đường then chốt để trở thành ${g}.`,
  userAdded: 'Bạn đã tự thêm học phần này vào lộ trình.',
  supportsGoal: (g) => `Học phần này hỗ trợ mục tiêu trở thành ${g} của bạn.`,
  finishFirst: (c) => `Hãy hoàn thành ${c} trước — học phần sẽ tự động mở khóa khi xong.`,
  noPrereq: (cur) => (cur ? 'Học phần không có điều kiện tiên quyết nên là điểm khởi đầu tốt nhất.' : 'Học phần không có điều kiện tiên quyết nên bạn có thể bắt đầu bất cứ lúc nào.'),
  alreadyHave: (lv, cur) => `Bạn đã có ${lv}, ${cur ? 'nên đây là bước học quan trọng tiếp theo của bạn.' : 'nên bạn có thể học song song với học phần hiện tại.'}`,
  prereqsDone: (cur) => (cur ? 'Các học phần tiên quyết đã xong, nên đây là bước học quan trọng tiếp theo của bạn.' : 'Các học phần tiên quyết đã xong, nên bạn có thể bắt đầu ngay.'),

  bulletMet: (s, c, r, src) => `Đã đạt yêu cầu ${s}: ${c}% ≥ ${r}% mà ${src} cần.`,
  bulletGap: (s, c, g, src, r) => `Lấp khoảng trống ${s}: ${c}% → ${g}% (${src} cần ${r}%).`,
  bulletMilestone: (p) => `Cột mốc của ${p}.`,
  bulletUnlocks: (c) => `Mở khóa ${c}.`,
  bulletRemoved: (c) => `Bạn đã xóa học phần tiên quyết ${c} — hãy chắc rằng bạn đã nắm nội dung đó.`,
  bulletAutoSkipped: (c, s, l) => `${c} được tự động bỏ qua: ${s} của bạn (${l}%) đã đáp ứng nội dung này.`,
  background: (m, s) => `Nền tảng ngành ${m} giúp bạn có lợi thế sẵn về ${s}.`,
  researchAlso: (r) => `Cũng liên quan đến hướng nghiên cứu của bạn: ${r}.`,
  time: (h, w, wk) => `≈${h} giờ học — khoảng ${w} tuần với tốc độ ${wk} giờ/tuần của bạn.`,

  outsideCompleted: 'Bạn đã hoàn thành học phần này — các kỹ năng của nó đã được tính vào hồ sơ của bạn.',
  outsideMet: (s, c, r) => `Bạn đã đáp ứng yêu cầu ${s} (${c}% ≥ ${r}%).`,
  outsideRaise: (s, c, g, r) => `Sẽ nâng ${s} từ ${c}% lên ${g}% (mục tiêu ${r}%).`,
  outsideMastered: 'Trình độ hiện tại của bạn đã bao quát nội dung học phần này.',
  outsideResearch: (r) => `Liên quan đến hướng nghiên cứu của bạn: ${r}.`,
  outsideNoCareer: 'Hãy đặt mục tiêu nghề nghiệp để xem học phần này phù hợp với lộ trình thế nào.',
  outsideHelps: (s, _n, c) => `Chưa có trong lộ trình, nhưng có thể giúp ích: ${s} thuộc mục tiêu ${c} của bạn. Hãy thêm nếu bạn muốn học sâu hơn.`,
  outsideNotNeeded: (c) => `Học phần này không cần cho lộ trình ${c} hiện tại — kế hoạch của bạn đã bao quát các kỹ năng nó bổ sung cho mục tiêu này.`,

  autoSkip: (c, ev) => `${c} được tự động bỏ qua — ${ev} của bạn đã bao quát nội dung học phần.`,
  evidence: (s, l, g) => `${s} ${l}% ≥ ${g}%`,

  shortCloses: (s, c, r) => `Lấp khoảng trống ${s} (${c}% → ${r}%)`,
  shortBuilds: (s) => `Phát triển ${s}`,
  shortMilestone: 'Dự án cột mốc của lộ trình',
  shortPrereq: (c) => `Tiên quyết của ${c}`,
  shortUser: 'Do bạn thêm',
};

export function phrases(lang: Lang): Phrases {
  return lang === 'vi' ? vi : en;
}
