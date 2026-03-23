import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
    const rows = db.prepare('SELECT * FROM currencies ORDER BY is_default DESC, code ASC').all();
    return json(rows);
};

export const POST: RequestHandler = async ({ request }) => {
    const { code, name, symbol, exchange_rate, is_default } = await request.json();
    
    if (!code || !name || !symbol) {
        return json({ error: 'Code, nom et symbole requis' }, { status: 400 });
    }

    try {
        if (is_default) {
            db.prepare('UPDATE currencies SET is_default = 0').run();
            // Sync with settings
            db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('currency', code.toUpperCase());
        }

        const result = db.prepare(
            'INSERT INTO currencies (code, name, symbol, exchange_rate, is_default) VALUES (?, ?, ?, ?, ?)'
        ).run(code.toUpperCase(), name, symbol, exchange_rate || 1, is_default ? 1 : 0);

        const row = db.prepare('SELECT * FROM currencies WHERE id = ?').get(result.lastInsertRowid);
        return json(row, { status: 201 });
    } catch (err: any) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return json({ error: 'Ce code devise existe déjà' }, { status: 400 });
        }
        return json({ error: 'Erreur lors de la création' }, { status: 500 });
    }
};
