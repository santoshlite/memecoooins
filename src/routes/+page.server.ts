import { prisma } from '$lib/server/database';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.auth.userId) {
        return {
            hasPortfolio: false
        };
    }

    const user = await prisma.user.findUnique({
        where: { clerkId: locals.auth.userId },
        select: { portfolio: true }
    });

    const hasPortfolio = user?.portfolio && 
                        Array.isArray(user.portfolio) && 
                        user.portfolio.length > 0;

    return {
        hasPortfolio
    };
};
