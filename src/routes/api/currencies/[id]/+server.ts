import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ request, params }) => {
    const { code, name, symbol, exchange_rate, active, is_default } = await request.json();
    
    try {
        if (is_default) {
            db.prepare('UPDATE currencies SET is_default = 0').run();
        }

        db.prepare(
            'UPDATE currencies SET code=?, name=?, symbol=?, exchange_rate=?, active=?, is_default=? WHERE id=?'
        ).run(code.toUpperCase(), name, symbol, exchange_rate, active ?? 1, is_default ? 1 : 0, params.id);

        const row = db.prepare('SELECT * FROM currencies WHERE id = ?').get(params.id);
        return json(row);
    } catch (err: any) {
        return json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }
};

export const DELETE: RequestHandler = ({ params }) => {
    try {
        // Don't delete the default currency
        const cur = db.prepare('SELECT is_default FROM currencies WHERE id = ?').get(params.id) as { is_default: number };
        if (cur?.is_default) {
            return json({ error: 'Impossible de supprimer la devise par défaut' }, { status: 400 });
        }

        db.prepare('DELETE FROM currencies WHERE id = ?').run(params.id);
        return json({ success: true });
    } catch (err) {
        return json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }
};
