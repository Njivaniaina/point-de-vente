import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const session = event.cookies.get('session');

	if (event.url.pathname.startsWith('/admin')) {
		if (!session) {
			throw redirect(303, `/login?redirectTo=${event.url.pathname}`);
		}
	}

	const response = await resolve(event);
	return response;
};
