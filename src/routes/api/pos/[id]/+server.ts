import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import type { RequestHandler } from './$types.js';

export const PUT: RequestHandler = async ({ request, params }) => {
  const db = getDb();
  const { name, location, active } = await request.json();
  db.prepare('UPDATE pos_instances SET name=?, location=?, active=? WHERE id=?').run(name || null, location || null, active ?? 1, params.id);
  const row = db.prepare('SELECT * FROM pos_instances WHERE id = ?').get(params.id);
  return json(row);
};

export const DELETE: RequestHandler = ({ params }) => {
  const db = getDb();
  db.prepare('DELETE FROM pos_instances WHERE id = ?').run(params.id);
  return json({ success: true });
};
