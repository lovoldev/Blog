import { loadPosts, loadNotes } from '$lib/posts';

export function load() {
	const posts = [...loadPosts('zh'), ...loadNotes('zh')].sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
	);
	return { posts };
}
