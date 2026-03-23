import { getDb } from '$lib/server/db.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = () => {
  const db = getDb();
  const currencies = db.prepare('SELECT * FROM currencies ORDER BY is_default DESC, code ASC').all();
  return { currencies };
};
