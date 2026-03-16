import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = () => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM pos_instances ORDER BY name').all();
  return json(rows);
};

export const POST: RequestHandler = async ({ request }) => {
  const db = getDb();
  const { name, location } = await request.json();
  if (!name) return json({ error: 'Name required' }, { status: 400 });
  const result = db.prepare('INSERT INTO pos_instances (name, location) VALUES (?, ?)').run(name, location || null);
  const row = db.prepare('SELECT * FROM pos_instances WHERE id = ?').get(result.lastInsertRowid);
  return json(row, { status: 201 });
};
