import { getDb } from '$lib/server/db.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = () => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM settings').all() as { key: string, value: string }[];
  const settings = rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
  return { settings };
};
