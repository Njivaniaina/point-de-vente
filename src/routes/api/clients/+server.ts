import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = () => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM clients ORDER BY name').all();
  return json(rows);
};

export const POST: RequestHandler = async ({ request }) => {
  const db = getDb();
  const { name, phone, email, address } = await request.json();
  if (!name) return json({ error: 'Name required' }, { status: 400 });
  const result = db.prepare('INSERT INTO clients (name, phone, email, address) VALUES (?, ?, ?, ?)').run(name, phone || null, email || null, address || null);
  const row = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);
  return json(row, { status: 201 });
};
