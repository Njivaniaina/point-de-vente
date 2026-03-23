import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = () => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM settings').all() as { key: string, value: string }[];
  const settings = rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
  return json(settings);
};

export const POST: RequestHandler = async ({ request }) => {
  const db = getDb();
  const settings = await request.json();

  const updateSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  
  const transaction = db.transaction((data) => {
    for (const [key, value] of Object.entries(data)) {
      updateSetting.run(key, value);
      
      // If updating the default currency, sync the currencies table
      if (key === 'currency') {
          db.prepare('UPDATE currencies SET is_default = 0').run();
          db.prepare('UPDATE currencies SET is_default = 1 WHERE code = ?').run(value);
      }
    }
  });

  transaction(settings);

  return json({ success: true });
};
