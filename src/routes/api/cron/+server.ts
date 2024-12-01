import { runCronJobs } from '$lib/utils/networth';
import { json } from '@sveltejs/kit';

export async function GET() {
  try {
    await runCronJobs();
    return json({ success: true });
  } catch (error) {
    console.error('Cron job failed:', error);
    return json({ success: false, error: 'Cron job failed' }, { status: 500 });
  }
}