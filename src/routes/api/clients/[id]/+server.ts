import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import type { RequestHandler } from './$types.js';

export const PUT: RequestHandler = async ({ request, params }) => {
  const db = getDb();
  const { name, phone, email, address, card_number } = await request.json();
  db.prepare('UPDATE clients SET name=?, phone=?, email=?, address=?, card_number=? WHERE id=?').run(name, phone || null, email || null, address || null, card_number || null, params.id);
  const row = db.prepare('SELECT * FROM clients WHERE id = ?').get(params.id);
  return json(row);
};

export const DELETE: RequestHandler = ({ params }) => {
  const db = getDb();
  db.prepare('DELETE FROM clients WHERE id = ?').run(params.id);
  return json({ success: true });
};
