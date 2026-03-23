import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import type { RequestHandler } from './$types.js';

export const PUT: RequestHandler = async ({ request, params }) => {
  const db = getDb();
  const body = await request.json();
  const { name, price, stock, unit, barcode, image_url, category_id, active, original_price, price_currency } = body;
  
  // If only 'active' is provided (restoration), we only update that
  if (Object.keys(body).length === 1 && active !== undefined) {
    db.prepare('UPDATE products SET active = ? WHERE id = ?').run(active, params.id);
  } else {
    db.prepare(
      'UPDATE products SET name=?, price=?, stock=?, unit=?, barcode=?, image_url=?, category_id=?, active=?, original_price=?, price_currency=? WHERE id=?'
    ).run(name, price, stock, unit || 'unité', barcode || null, image_url || null, category_id || null, active ?? 1, original_price || price, price_currency || 'MGA', params.id);
  }
  
  const row = db.prepare('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?').get(params.id);
  return json(row);
};

export const DELETE: RequestHandler = ({ params }) => {
  const db = getDb();
  db.prepare('UPDATE products SET active = 0 WHERE id = ?').run(params.id);
  return json({ success: true });
};
