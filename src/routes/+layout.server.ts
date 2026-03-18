import { getDb } from '$lib/server/db.js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ cookies }) => {
  const db = getDb();
  const session = cookies.get('session');
  let user = null;

  if (session) {
    user = db.prepare('SELECT id, username FROM users WHERE username = ?').get(session) as { id: number, username: string };
  }

  const settingsRows = db.prepare('SELECT * FROM settings').all() as { key: string, value: string }[];
  const settings = settingsRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});

  return { settings, user };
};
