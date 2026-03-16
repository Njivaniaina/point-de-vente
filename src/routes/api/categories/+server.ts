import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = () => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM categories ORDER BY name').all();
  return json(rows);
};

export const POST: RequestHandler = async ({ request }) => {
  const db = getDb();
  const { name, color } = await request.json();
  if (!name) return json({ error: 'Name required' }, { status: 400 });
  const result = db.prepare('INSERT INTO categories (name, color) VALUES (?, ?)').run(name, color || '#3b82f6');
  const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
  return json(row, { status: 201 });
};
