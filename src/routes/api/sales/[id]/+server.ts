import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = ({ params }) => {
  const db = getDb();
  const sale = db.prepare(`
    SELECT s.*, p.name as pos_name, c.name as client_name
    FROM sales s
    JOIN pos_instances p ON s.pos_id = p.id
    LEFT JOIN clients c ON s.client_id = c.id
    WHERE s.id = ?
  `).get(params.id);

  if (!sale) return json({ error: 'Sale not found' }, { status: 404 });

  const items = db.prepare(`
    SELECT si.*, pr.name as product_name
    FROM sale_items si
    JOIN products pr ON si.product_id = pr.id
    WHERE si.sale_id = ?
  `).all(params.id);

  return json({ sale, items });
};
