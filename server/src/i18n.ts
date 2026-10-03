export type Lang = 'en' | 'vi';
export const LANGS: Lang[] = ['en', 'vi'];

/** The client sends its UI language as Accept-Language; anything other than Vietnamese falls back to English. */
export function detectLang(header: string | undefined): Lang {
  return header && /^\s*vi\b/i.test(header) ? 'vi' : 'en';
}

export function interpolate(text: string, vars?: Record<string, string | number>) {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));
}

/** Vietnamese for user-facing API messages, keyed by the English text. */
const VI_MESSAGES: Record<string, string> = {
  'Not found': 'Không tìm thấy',
  'Something went wrong on our side': 'Đã xảy ra lỗi phía máy chủ',
  'Malformed JSON body': 'Dữ liệu gửi lên không hợp lệ',
  'Invalid input': 'Dữ liệu không hợp lệ',
  'Please sign in to continue': 'Vui lòng đăng nhập để tiếp tục',
  'Account not found': 'Không tìm thấy tài khoản',
  'Too many attempts – please wait a minute and try again': 'Bạn đã thử quá nhiều lần — vui lòng đợi một phút rồi thử lại',
  'An account with this email already exists': 'Email này đã được đăng ký',
  'Incorrect email or password': 'Email hoặc mật khẩu không đúng',
  'If an account exists for that email, a reset link is on its way.': 'Nếu email này đã được đăng ký, liên kết đặt lại mật khẩu đang được gửi tới bạn.',
  'This reset link is invalid or has expired. Request a new one.': 'Liên kết đặt lại không hợp lệ hoặc đã hết hạn. Hãy yêu cầu liên kết mới.',
  'Your current password is incorrect': 'Mật khẩu hiện tại không đúng',
  'Enter a valid email address': 'Hãy nhập địa chỉ email hợp lệ',
  'Password must be at least 8 characters': 'Mật khẩu phải có ít nhất 8 ký tự',
  'Enter your name': 'Hãy nhập họ tên',
  'Enter your password': 'Hãy nhập mật khẩu',
  'Type a question': 'Hãy nhập câu hỏi',
  'Choose a career goal first': 'Hãy chọn mục tiêu nghề nghiệp trước',
  'Choose a research direction first': 'Hãy chọn hướng nghiên cứu trước',
  'Set a career goal to generate your roadmap': 'Hãy đặt mục tiêu nghề nghiệp để tạo lộ trình',
  'Set a career goal first': 'Hãy đặt mục tiêu nghề nghiệp trước',
  'Course not found': 'Không tìm thấy học phần',
  'Career not found': 'Không tìm thấy nghề nghiệp',
  'That course is not in your roadmap': 'Học phần này không có trong lộ trình của bạn',
  'You have already completed this course': 'Bạn đã hoàn thành học phần này',
  '{title} is already in your roadmap': '{title} đã có trong lộ trình của bạn',
  'It is already the first course': 'Đây đã là học phần đầu tiên',
  'It is already the last course': 'Đây đã là học phần cuối cùng',
  '{a} is a prerequisite of {b}, so it has to come first': '{a} là học phần tiên quyết của {b} nên phải đứng trước',
  'Unknown skill {id}': 'Không tồn tại kỹ năng {id}',
  'Unknown course {id}': 'Không tồn tại học phần {id}',
  'Unknown career': 'Nghề nghiệp không tồn tại',
  'Unknown research direction': 'Hướng nghiên cứu không tồn tại',
  'Unknown secondary career': 'Nghề nghiệp phụ không tồn tại',
  'Unknown secondary research direction': 'Hướng nghiên cứu phụ không tồn tại',
};

export function tr(lang: Lang, message: string, vars?: Record<string, string | number>) {
  return interpolate(lang === 'vi' ? VI_MESSAGES[message] ?? message : message, vars);
}

export function listJoin(lang: Lang, items: string[]) {
  const and = lang === 'vi' ? ' và ' : ' and ';
  return items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')}${and}${items[items.length - 1]}`;
}
