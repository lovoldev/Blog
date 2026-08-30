import { loadPosts, loadNotes } from '$lib/posts';
import { generateOgSvg } from '$lib/og';

export const prerender = true;

export function entries() {
	return [...loadPosts('zh'), ...loadNotes('zh')].map((post) => ({ slug: post.slug }));
}

export function GET({ params }: { params: { slug: string } }) {
	const post = [...loadPosts('zh'), ...loadNotes('zh')].find((p) => p.slug === params.slug);
	if (!post) return new Response('Not found', { status: 404 });
	return new Response(generateOgSvg(post.title, 'zh'), {
		headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' },
	});
}
