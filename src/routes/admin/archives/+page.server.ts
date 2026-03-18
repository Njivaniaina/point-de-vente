import { getDb } from '$lib/server/db.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = () => {
  const db = getDb();
  const archivedProducts = db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.active = 0
    ORDER BY p.name
  `).all();

  const archivedPos = db.prepare(`
    SELECT * FROM pos_instances WHERE active = 0 ORDER BY name
  `).all();

  return { archivedProducts, archivedPos };
};
