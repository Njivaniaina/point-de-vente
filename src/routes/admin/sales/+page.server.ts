import { getDb } from '$lib/server/db.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = () => {
  const db = getDb();
  const sales = db.prepare(`
    SELECT s.*, p.name as pos_name, c.name as client_name
    FROM sales s
    JOIN pos_instances p ON s.pos_id = p.id
    LEFT JOIN clients c ON s.client_id = c.id
    ORDER BY s.created_at DESC
    LIMIT 200
  `).all();
  const settingsRows = db.prepare('SELECT * FROM settings').all() as { key: string, value: string }[];
  const settings = settingsRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
  const currencies = db.prepare('SELECT * FROM currencies').all();

  return { sales, settings, currencies };
};
