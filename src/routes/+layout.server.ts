import { getDb } from '$lib/server/db.js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = () => {
  const db = getDb();
  const settingsRows = db.prepare('SELECT * FROM settings').all() as { key: string, value: string }[];
  const settings = settingsRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});

  return { settings };
};
