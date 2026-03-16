import { getDb } from '$lib/server/db.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = () => {
  const db = getDb();
  return { posInstances: db.prepare('SELECT * FROM pos_instances ORDER BY name').all() };
};
