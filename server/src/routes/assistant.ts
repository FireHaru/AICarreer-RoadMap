import { Router } from 'express';
import { z } from 'zod';
import { activeProvider, llmAnswer, type ChatTurn } from '../ai/llm.js';
import { contextForLlm, localAnswer } from '../ai/localAssistant.js';
import { buildContext } from '../engine/context.js';
import { requireAuth } from '../middleware/auth.js';
import { ensureRoadmap, roadmapView } from '../services/roadmapService.js';
import { learner } from './helpers.js';

export const assistantRouter = Router();
assistantRouter.use(requireAuth);

assistantRouter.get('/history', async (req, res) => {
  const { db } = await learner(req);
  const rows = await db.query(
    'SELECT id, role, content, meta, created_at FROM chat_messages WHERE user_id = $1 ORDER BY id DESC LIMIT 60',
    [req.userId],
  );
  res.json({
    provider: activeProvider() ?? 'local',
    messages: rows.reverse().map((r) => ({ id: r.id, role: r.role, content: r.content, actions: r.meta?.actions ?? [], provider: r.meta?.provider, createdAt: r.created_at })),
  });
});

assistantRouter.delete('/history', async (req, res) => {
  const { db } = await learner(req);
  await db.query('DELETE FROM chat_messages WHERE user_id = $1', [req.userId]);
  res.json({ ok: true });
});

assistantRouter.post('/chat', async (req, res) => {
  const { message } = z.object({ message: z.string().trim().min(1, 'Type a question').max(1000) }).parse(req.body);
  const { db, cat, profile } = await learner(req);
  const roadmap = await ensureRoadmap(db, cat, profile);
  const view = roadmap ? roadmapView(cat, profile, roadmap) : null;
  const ctx = buildContext(cat, profile, roadmap ? cat.paths.get(roadmap.pathId)! : undefined);
  const input = { ctx, view };

  const local = localAnswer(input, message);
  let text = local.text;
  let provider: string = 'local';
  const llm = activeProvider();
  if (llm) {
    try {
      const history = (await db.query<ChatTurn>(
        'SELECT role, content FROM chat_messages WHERE user_id = $1 ORDER BY id DESC LIMIT 8',
        [req.userId],
      )).reverse();
      text = await llmAnswer(llm, contextForLlm(input), local.text, history, message);
      provider = llm;
    } catch (err) {
      console.warn('[assistant] LLM call failed, using local engine:', (err as Error).message);
    }
  }

  await db.query(`INSERT INTO chat_messages (user_id, role, content) VALUES ($1, 'user', $2)`, [req.userId, message]);
  const [saved] = await db.query<{ id: number; created_at: string }>(
    `INSERT INTO chat_messages (user_id, role, content, meta) VALUES ($1, 'assistant', $2, $3) RETURNING id, created_at`,
    [req.userId, text, JSON.stringify({ actions: local.actions, provider, intent: local.intent })],
  );
  res.json({
    message: { id: saved.id, role: 'assistant', content: text, actions: local.actions, provider, createdAt: saved.created_at },
    suggestions: local.suggestions,
  });
});
