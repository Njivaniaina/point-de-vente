import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = () => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT p.*, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE p.active = 1
    ORDER BY p.name
  `).all();
  return json(rows);
};

export const POST: RequestHandler = async ({ request }) => {
  const db = getDb();
  const { name, price, stock, barcode, image_url, category_id } = await request.json();
  if (!name) return json({ error: 'Name required' }, { status: 400 });
  const result = db.prepare(
    'INSERT INTO products (name, price, stock, barcode, image_url, category_id) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, price || 0, stock || 0, barcode || null, image_url || null, category_id || null);
  const row = db.prepare('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?').get(result.lastInsertRowid);
  return json(row, { status: 201 });
};
