import { json } from '@sveltejs/kit';
import { db, hashPassword } from '$lib/server/db';

export const POST = async ({ request, cookies }) => {
	const session = cookies.get('session');
	if (!session) {
		return json({ error: 'Non autorisé' }, { status: 401 });
	}

	const { username, password } = await request.json();

	if (!username) {
		return json({ error: 'Nom d\'utilisateur requis' }, { status: 400 });
	}

	try {
		if (password) {
			const password_hash = hashPassword(password);
			db.prepare('UPDATE users SET username = ?, password_hash = ? WHERE username = ?').run(username, password_hash, session);
		} else {
			db.prepare('UPDATE users SET username = ? WHERE username = ?').run(username, session);
		}

		// Update session cookie if username changed
		cookies.set('session', username, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 * 7
		});

		return json({ success: true });
	} catch (err: any) {
		if (err.message.includes('UNIQUE constraint failed')) {
			return json({ error: 'Ce nom d\'utilisateur est déjà pris' }, { status: 400 });
		}
		return json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
	}
};
