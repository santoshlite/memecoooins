import { runCronJobs } from '$lib/utils/networth';
import { json } from '@sveltejs/kit';

export async function GET({ request }) {
	// Only check authorization in production
	if (process.env.NODE_ENV === 'production') {
		if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
			return new Response('Unauthorized', { status: 401 });
		}
	}

	try {
		await runCronJobs();
		return json({ success: true });
	} catch (error) {
		console.error('Cron job failed:', error);
		return json({ success: false, error: 'Cron job failed' }, { status: 500 });
	}
}
