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
  const { name, price, stock, unit, barcode, image_url, category_id, original_price, price_currency } = await request.json();
  if (!name) return json({ error: 'Name required' }, { status: 400 });
  const result = db.prepare(
    'INSERT INTO products (name, price, stock, unit, barcode, image_url, category_id, original_price, price_currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(name, price, stock, unit || 'unité', barcode || null, image_url || null, category_id || null, original_price || price, price_currency || 'MGA');
  const row = db.prepare('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?').get(result.lastInsertRowid);
  return json(row, { status: 201 });
};
