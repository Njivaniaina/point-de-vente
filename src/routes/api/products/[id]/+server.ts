import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import type { RequestHandler } from './$types.js';

export const PUT: RequestHandler = async ({ request, params }) => {
  const db = getDb();
  const { name, price, stock, barcode, image_url, category_id } = await request.json();
  db.prepare(
    'UPDATE products SET name=?, price=?, stock=?, barcode=?, image_url=?, category_id=? WHERE id=?'
  ).run(name, price, stock, barcode || null, image_url || null, category_id || null, params.id);
  const row = db.prepare('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?').get(params.id);
  return json(row);
};

export const DELETE: RequestHandler = ({ params }) => {
  const db = getDb();
  db.prepare('UPDATE products SET active = 0 WHERE id = ?').run(params.id);
  return json({ success: true });
};
