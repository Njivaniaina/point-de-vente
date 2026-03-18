import { fail, redirect } from '@sveltejs/kit';
import { db, hashPassword } from '$lib/server/db';

export const load = async ({ locals, cookies }) => {
	const session = cookies.get('session');
	if (session) {
		throw redirect(303, '/admin');
	}
};

export const actions = {
	default: async ({ request, cookies, url }) => {
		const data = await request.formData();
		const username = data.get('username') as string;
		const password = data.get('password') as string;

		if (!username || !password) {
			return fail(400, { error: 'Identifiants requis' });
		}

		const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;

		if (!user || user.password_hash !== hashPassword(password)) {
			return fail(401, { error: 'Identifiants incorrects' });
		}

		// Set session cookie
		cookies.set('session', username, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 * 7 // 1 week
		});

		const redirectTo = url.searchParams.get('redirectTo') || '/admin';
		throw redirect(303, redirectTo);
	}
};
