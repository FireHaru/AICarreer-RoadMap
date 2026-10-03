/**
 * PostgreSQL schema. Runs unchanged on a real PostgreSQL server or on the embedded PGlite engine.
 *
 * Catalog:   skills, careers, research_directions, courses (+ prerequisites, skills, career/research links),
 *            career_paths (alternative roadmaps), projects (+ skills, courses, careers, research)
 * Learner:   users, user_interests, user_skills, user_completed_courses
 * Roadmaps:  roadmaps (one active per user), roadmap_courses (ordered, with stored reasons)
 * i18n:      catalog_translations (Vietnamese text for catalog entities)
 */
export const SCHEMA = /* sql */ `
CREATE TABLE IF NOT EXISTS skills (
  id          SERIAL PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS careers (
  id          SERIAL PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  icon        TEXT NOT NULL DEFAULT 'briefcase',
  tagline     TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  portfolio   JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS research_directions (
  id          SERIAL PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  icon        TEXT NOT NULL DEFAULT 'flask-conical',
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS courses (
  id          SERIAL PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  category    TEXT NOT NULL,
  difficulty  TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
  credits     INT  NOT NULL CHECK (credits >= 0),
  hours       INT  NOT NULL CHECK (hours > 0),
  kind        TEXT NOT NULL DEFAULT 'course' CHECK (kind IN ('course', 'project')),
  summary     TEXT NOT NULL,
  description TEXT NOT NULL,
  outcomes    JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS course_prerequisites (
  course_id       INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  prerequisite_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, prerequisite_id),
  CHECK (course_id <> prerequisite_id)
);

CREATE TABLE IF NOT EXISTS course_skills (
  course_id  INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  skill_id   INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  gain_level INT NOT NULL CHECK (gain_level BETWEEN 0 AND 100),
  PRIMARY KEY (course_id, skill_id)
);

CREATE TABLE IF NOT EXISTS career_skills (
  career_id      INT  NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  skill_id       INT  NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  required_level INT  NOT NULL CHECK (required_level BETWEEN 0 AND 100),
  weight         REAL NOT NULL DEFAULT 1 CHECK (weight > 0 AND weight <= 1),
  PRIMARY KEY (career_id, skill_id)
);

CREATE TABLE IF NOT EXISTS career_courses (
  career_id INT  NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  course_id INT  NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  relevance TEXT NOT NULL DEFAULT 'core' CHECK (relevance IN ('core', 'elective')),
  PRIMARY KEY (career_id, course_id)
);

CREATE TABLE IF NOT EXISTS research_skills (
  research_id    INT  NOT NULL REFERENCES research_directions(id) ON DELETE CASCADE,
  skill_id       INT  NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  required_level INT  NOT NULL CHECK (required_level BETWEEN 0 AND 100),
  weight         REAL NOT NULL DEFAULT 1 CHECK (weight > 0 AND weight <= 1),
  PRIMARY KEY (research_id, skill_id)
);

CREATE TABLE IF NOT EXISTS research_courses (
  research_id INT  NOT NULL REFERENCES research_directions(id) ON DELETE CASCADE,
  course_id   INT  NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  relevance   TEXT NOT NULL DEFAULT 'core' CHECK (relevance IN ('core', 'elective')),
  PRIMARY KEY (research_id, course_id)
);

CREATE TABLE IF NOT EXISTS career_paths (
  id              SERIAL PRIMARY KEY,
  career_id       INT  NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  slug            TEXT NOT NULL,
  name            TEXT NOT NULL,
  kind            TEXT NOT NULL CHECK (kind IN ('standard', 'research', 'specialization')),
  description     TEXT NOT NULL DEFAULT '',
  research_weight REAL NOT NULL DEFAULT 0 CHECK (research_weight BETWEEN 0 AND 1),
  sort_order      INT  NOT NULL DEFAULT 0,
  UNIQUE (career_id, slug)
);

CREATE TABLE IF NOT EXISTS career_path_skills (
  path_id        INT  NOT NULL REFERENCES career_paths(id) ON DELETE CASCADE,
  skill_id       INT  NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  required_level INT  NOT NULL CHECK (required_level BETWEEN 0 AND 100),
  weight         REAL NOT NULL DEFAULT 1,
  PRIMARY KEY (path_id, skill_id)
);

CREATE TABLE IF NOT EXISTS career_path_courses (
  path_id   INT NOT NULL REFERENCES career_paths(id) ON DELETE CASCADE,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  PRIMARY KEY (path_id, course_id)
);

CREATE TABLE IF NOT EXISTS projects (
  id          SERIAL PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  level       TEXT NOT NULL CHECK (level IN ('Beginner', 'Intermediate', 'Advanced', 'Research')),
  hours       INT  NOT NULL,
  summary     TEXT NOT NULL,
  description TEXT NOT NULL,
  outcomes    JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS project_skills (
  project_id     INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  skill_id       INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  required_level INT NOT NULL CHECK (required_level BETWEEN 0 AND 100),
  PRIMARY KEY (project_id, skill_id)
);

CREATE TABLE IF NOT EXISTS project_courses (
  project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  course_id  INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, course_id)
);

CREATE TABLE IF NOT EXISTS project_careers (
  project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  career_id  INT NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, career_id)
);

CREATE TABLE IF NOT EXISTS project_research (
  project_id  INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  research_id INT NOT NULL REFERENCES research_directions(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, research_id)
);

-- Localised catalog text: one row per (entity, id, language, field). value is a string or a string array.
CREATE TABLE IF NOT EXISTS catalog_translations (
  entity TEXT  NOT NULL CHECK (entity IN ('skill', 'course', 'career', 'research', 'path', 'project')),
  ref_id INT   NOT NULL,
  lang   TEXT  NOT NULL,
  field  TEXT  NOT NULL,
  value  JSONB NOT NULL,
  PRIMARY KEY (entity, ref_id, lang, field)
);

CREATE TABLE IF NOT EXISTS app_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id                  SERIAL PRIMARY KEY,
  email               TEXT NOT NULL UNIQUE,
  password_hash       TEXT NOT NULL,
  full_name           TEXT NOT NULL,
  university          TEXT,
  major               TEXT,
  year_of_study       INT  CHECK (year_of_study BETWEEN 1 AND 8),
  gpa                 REAL CHECK (gpa BETWEEN 0 AND 10),
  weekly_hours        INT  NOT NULL DEFAULT 10 CHECK (weekly_hours BETWEEN 1 AND 80),
  primary_career_id   INT  REFERENCES careers(id) ON DELETE SET NULL,
  primary_research_id INT  REFERENCES research_directions(id) ON DELETE SET NULL,
  onboarded           BOOLEAN NOT NULL DEFAULT FALSE,
  reset_token_hash    TEXT,
  reset_expires_at    TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_interests (
  user_id INT  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind    TEXT NOT NULL CHECK (kind IN ('career', 'research')),
  ref_id  INT  NOT NULL,
  PRIMARY KEY (user_id, kind, ref_id)
);

CREATE TABLE IF NOT EXISTS user_skills (
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id   INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  level      INT NOT NULL CHECK (level BETWEEN 0 AND 100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, skill_id)
);

CREATE TABLE IF NOT EXISTS user_completed_courses (
  user_id      INT  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id    INT  NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  source       TEXT NOT NULL DEFAULT 'roadmap' CHECK (source IN ('onboarding', 'roadmap', 'library')),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS roadmaps (
  id           SERIAL PRIMARY KEY,
  user_id      INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  career_id    INT NOT NULL REFERENCES careers(id),
  research_id  INT REFERENCES research_directions(id),
  path_id      INT NOT NULL REFERENCES career_paths(id),
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  auto_skipped JSONB NOT NULL DEFAULT '[]',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS roadmaps_one_active_per_user ON roadmaps (user_id) WHERE is_active;

CREATE TABLE IF NOT EXISTS roadmap_courses (
  roadmap_id INT  NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  course_id  INT  NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  position   INT  NOT NULL,
  origin     TEXT NOT NULL CHECK (origin IN ('skill_gap', 'prerequisite', 'path', 'user')),
  skipped    BOOLEAN NOT NULL DEFAULT FALSE,
  priority   REAL NOT NULL DEFAULT 0,
  reasons    JSONB NOT NULL DEFAULT '[]',
  added_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (roadmap_id, course_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id         SERIAL PRIMARY KEY,
  user_id    INT  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  meta       JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chat_messages_user_idx ON chat_messages (user_id, id);
`;

export const DROP_ALL = /* sql */ `
DROP TABLE IF EXISTS app_meta, catalog_translations, chat_messages, roadmap_courses, roadmaps, user_completed_courses, user_skills, user_interests, users,
  project_research, project_careers, project_courses, project_skills, projects,
  career_path_courses, career_path_skills, career_paths,
  research_courses, research_skills, career_courses, career_skills,
  course_skills, course_prerequisites, courses, research_directions, careers, skills CASCADE;
`;
