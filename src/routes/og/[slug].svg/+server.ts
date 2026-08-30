import { loadPosts, loadNotes } from '$lib/posts';
import { generateOgSvg } from '$lib/og';

export const prerender = true;

export function entries() {
	return [...loadPosts('en'), ...loadNotes('en')].map((post) => ({ slug: post.slug }));
}

export function GET({ params }: { params: { slug: string } }) {
	const post = [...loadPosts('en'), ...loadNotes('en')].find((p) => p.slug === params.slug);
	if (!post) return new Response('Not found', { status: 404 });
	return new Response(generateOgSvg(post.title, 'en'), {
		headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' },
	});
}
