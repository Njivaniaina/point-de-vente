import { getDb } from '$lib/server/db.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = () => {
  const db = getDb();
  return { clients: db.prepare('SELECT * FROM clients ORDER BY name').all() };
};
