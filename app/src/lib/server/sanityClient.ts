import { PUBLIC_SANITY_DATASET, PUBLIC_SANITY_PROJECT_ID } from '$env/static/public';
import { createClient } from '@sanity/client';

export const sanityClient = createClient({
	projectId: PUBLIC_SANITY_PROJECT_ID,
	dataset: PUBLIC_SANITY_DATASET,
	useCdn: true, // `false` if you want to ensure fresh data
	apiVersion: '2026-05-21',
	perspective: 'published'
});
