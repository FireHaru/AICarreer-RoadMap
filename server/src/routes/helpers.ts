import type { Request } from 'express';
import { z } from 'zod';
import { getDb } from '../db/client.js';
import { loadCatalog } from '../engine/catalog.js';
import { emptyProfile } from '../engine/context.js';
import type { Catalog, Course } from '../engine/types.js';
import { HttpError } from '../middleware/errors.js';
import { loadProfile } from '../services/learner.js';

export async function learner(req: Request) {
  const db = getDb();
  const cat = await loadCatalog(db, req.lang);
  const { user, profile } = await loadProfile(db, req.userId!);
  return { db, cat, user, profile };
}

/** Profile for optionally-authenticated endpoints: the real learner when signed in, otherwise a blank one. */
export async function maybeLearner(req: Request) {
  const db = getDb();
  const cat = await loadCatalog(db, req.lang);
  if (!req.userId) return { db, cat, user: null, profile: emptyProfile() };
  try {
    const { user, profile } = await loadProfile(db, req.userId);
    return { db, cat, user, profile };
  } catch {
    return { db, cat, user: null, profile: emptyProfile() };
  }
}

export const idParam = z.coerce.number().int().positive();

/** Courses can be addressed by numeric id or by code (e.g. "ML201"). */
export function findCourse(cat: Catalog, key: string): Course {
  const byCode = cat.coursesByCode.get(key.toUpperCase());
  const course = byCode ?? (/^\d+$/.test(key) ? cat.courses.get(Number(key)) : undefined);
  if (!course) throw new HttpError(404, 'Course not found');
  return course;
}
