import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import type { RequestHandler } from './$types.js';

export const PUT: RequestHandler = async ({ request, params }) => {
  const db = getDb();
  const { name, color } = await request.json();
  db.prepare('UPDATE categories SET name = ?, color = ? WHERE id = ?').run(name, color, params.id);
  const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(params.id);
  return json(row);
};

export const DELETE: RequestHandler = ({ params }) => {
  const db = getDb();
  db.prepare('DELETE FROM categories WHERE id = ?').run(params.id);
  return json({ success: true });
};
