import { runCronJobs } from '$lib/utils/networth';
import { json } from '@sveltejs/kit';
import { CRON_AUTH_KEY, ENVIRONMENT } from '$env/static/private';

export async function GET({ request }) {
	// Only check authorization in production
	// if (ENVIRONMENT === 'production') {
	// 	if (request.headers.get('Authorization') !== `Bearer ${CRON_AUTH_KEY}`) {
	// 		return new Response('Unauthorized', { status: 401 });
	// 	}
	// }

	try {
		await runCronJobs();
		return json({ success: true });
	} catch (error) {
		console.error('Cron job failed:', error);
		return json({ success: false, error: 'Cron job failed' }, { status: 500 });
	}
}
