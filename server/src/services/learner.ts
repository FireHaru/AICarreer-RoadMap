import type { Queryable } from '../db/client.js';
import type { LearnerProfile } from '../engine/types.js';
import { HttpError } from '../middleware/errors.js';

export interface UserRow {
  id: number;
  email: string;
  full_name: string;
  university: string | null;
  major: string | null;
  year_of_study: number | null;
  gpa: number | null;
  weekly_hours: number;
  primary_career_id: number | null;
  primary_research_id: number | null;
  onboarded: boolean;
  created_at: string;
}

const USER_COLUMNS = 'id, email, full_name, university, major, year_of_study, gpa, weekly_hours, primary_career_id, primary_research_id, onboarded, created_at';

export async function getUser(db: Queryable, userId: number): Promise<UserRow> {
  const [user] = await db.query<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [userId]);
  if (!user) throw new HttpError(401, 'Account not found');
  return user;
}

export function publicUser(u: UserRow) {
  return {
    id: u.id,
    email: u.email,
    fullName: u.full_name,
    university: u.university,
    major: u.major,
    yearOfStudy: u.year_of_study,
    gpa: u.gpa,
    weeklyHours: u.weekly_hours,
    careerId: u.primary_career_id,
    researchId: u.primary_research_id,
    onboarded: u.onboarded,
    createdAt: u.created_at,
  };
}

export async function loadProfile(db: Queryable, userId: number): Promise<{ user: UserRow; profile: LearnerProfile }> {
  const user = await getUser(db, userId);
  const [skills, completed, interests] = await Promise.all([
    db.query<{ skill_id: number; level: number }>('SELECT skill_id, level FROM user_skills WHERE user_id = $1', [userId]),
    db.query<{ course_id: number }>('SELECT course_id FROM user_completed_courses WHERE user_id = $1', [userId]),
    db.query<{ kind: string; ref_id: number }>('SELECT kind, ref_id FROM user_interests WHERE user_id = $1 ORDER BY ref_id', [userId]),
  ]);
  return {
    user,
    profile: {
      userId,
      fullName: user.full_name,
      major: user.major,
      yearOfStudy: user.year_of_study,
      weeklyHours: user.weekly_hours,
      selfSkills: new Map(skills.map((s) => [s.skill_id, s.level])),
      completed: new Set(completed.map((c) => c.course_id)),
      careerId: user.primary_career_id,
      researchId: user.primary_research_id,
      secondaryCareerIds: interests.filter((i) => i.kind === 'career').map((i) => i.ref_id),
      secondaryResearchIds: interests.filter((i) => i.kind === 'research').map((i) => i.ref_id),
    },
  };
}
