import { getDb } from '$lib/server/db.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = () => {
  const db = getDb();
  const products = db.prepare(`
    SELECT p.*, c.name as category_name, c.color as category_color
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.active = 1 AND p.stock > 0
    ORDER BY p.name
  `).all();
  const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
  const clients = db.prepare('SELECT * FROM clients ORDER BY name').all();
  const posInstances = db.prepare('SELECT * FROM pos_instances WHERE active = 1 ORDER BY name').all();
  
  const settingsRows = db.prepare('SELECT * FROM settings').all() as { key: string, value: string }[];
  const settings = settingsRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});

  return { products, categories, clients, posInstances, settings };
};
