import { getDb } from '$lib/server/db.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = () => {
  const db = getDb();
  const products = db.prepare(`
    SELECT p.*, c.name as category_name, c.color as category_color
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.active = 1
    ORDER BY p.name
  `).all();
  const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
  const currencies = db.prepare('SELECT * FROM currencies WHERE active = 1').all();
  return { products, categories, currencies };
};
