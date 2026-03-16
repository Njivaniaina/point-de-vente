import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = () => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT s.*, p.name as pos_name, c.name as client_name
    FROM sales s
    JOIN pos_instances p ON s.pos_id = p.id
    LEFT JOIN clients c ON s.client_id = c.id
    ORDER BY s.created_at DESC
    LIMIT 200
  `).all();
  return json(rows);
};

export const POST: RequestHandler = async ({ request }) => {
  const db = getDb();
  const { pos_id, client_id, items, payment_method, note } = await request.json();

  if (!pos_id || !items || items.length === 0) {
    return json({ error: 'POS and items required' }, { status: 400 });
  }

  const total_amount = items.reduce((sum: number, item: { quantity: number; unit_price: number }) => sum + item.quantity * item.unit_price, 0);
  const invoice_ref = `INV-${Date.now()}`;

  const insertSale = db.transaction(() => {
    const saleResult = db.prepare(
      'INSERT INTO sales (pos_id, client_id, total_amount, payment_method, invoice_ref, note) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(pos_id, client_id || null, total_amount, payment_method || 'cash', invoice_ref, note || null);

    const saleId = saleResult.lastInsertRowid;

    const insertItem = db.prepare(
      'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)'
    );

    for (const item of items) {
      insertItem.run(saleId, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price);
      // Update stock
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity, item.product_id);
    }

    return saleId;
  });

  const saleId = insertSale();

  const sale = db.prepare(`
    SELECT s.*, p.name as pos_name, c.name as client_name
    FROM sales s
    JOIN pos_instances p ON s.pos_id = p.id
    LEFT JOIN clients c ON s.client_id = c.id
    WHERE s.id = ?
  `).get(saleId);

  const saleItems = db.prepare(`
    SELECT si.*, pr.name as product_name
    FROM sale_items si
    JOIN products pr ON si.product_id = pr.id
    WHERE si.sale_id = ?
  `).all(saleId);

  return json({ sale, items: saleItems }, { status: 201 });
};
