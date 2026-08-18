import { healthQuery } from '$lib/utils/sanity';
import type { PageServerLoad } from './$types';
import type { HealthData } from '$lib/types/sanity';
import { error } from '@sveltejs/kit';
import { sanityClient } from '$lib/server/sanityClient';

export const load: PageServerLoad = async () => {
	try {
		const health = await sanityClient.fetch<HealthData>(healthQuery());
		return { health };
	} catch (err) {
		console.error(err);
		error(500, 'Failed to fetch health data from Sanity');
	}
};
