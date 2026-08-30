import { loadPosts, loadNotes } from '$lib/posts';

export function load() {
	const posts = [...loadPosts('en'), ...loadNotes('en')].sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
	);
	return { posts };
}
