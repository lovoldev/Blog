import { loadNotes, loadPosts } from '$lib/posts'
import type { Post } from '$lib/types'

export const prerender = true

interface UrlEntry {
	path: string
	lastmod?: string
}

function lastmodOf(post: Post): string {
	const value = post.updated && post.updated !== post.date ? post.updated : post.date
	return new Date(value).toISOString().slice(0, 10)
}

async function formatContent(lang: string): Promise<UrlEntry[]> {
	const posts = await loadPosts(lang)
	const notes = await loadNotes(lang)
	return [
		...posts.map((post) => ({ path: `posts/${post.slug}`, lastmod: lastmodOf(post) })),
		...notes.map((note) => ({ path: `posts/notes/${note.slug}`, lastmod: lastmodOf(note) })),
	]
}

async function gen(target: string, alternate: string): Promise<string> {
	const siteUrl = 'https://zevarc.com'

	const fixUrls: UrlEntry[] = [{ path: '' }, { path: 'posts' }, { path: 'projects' }, { path: 'search' }]
	const contents = await formatContent(target)

	const urlEntries = fixUrls.concat(contents)
	const sitemap = urlEntries
		.map(({ path: url, lastmod }) => {
			const origin = 'en' === target ? `${siteUrl}/${url}` : `${siteUrl}/${target}/${url}`
			const alternateUrl = 'en' === alternate ? `${siteUrl}/${url}` : `${siteUrl}/${alternate}/${url}`
			const lastmodTag = lastmod ? `\n                <lastmod>${lastmod}</lastmod>` : ''
			return `
                <url>
                <loc>${origin}</loc>${lastmodTag}
                <xhtml:link
                        rel="alternate"
                        hreflang="${target}"
                        href="${origin}"/>
                <xhtml:link
                        rel="alternate"
                        hreflang="${alternate}"
                        href="${alternateUrl}"/>
                <xhtml:link
                        rel="alternate"
                        hreflang="x-default"
                        href="${origin}"/>
                </url>`
		})
		.join('')
	return sitemap
}

export async function GET() {
	const urls = await gen('en', 'zh')

	return new Response(
		`
		<?xml version="1.0" encoding="UTF-8" ?>
		<urlset
			xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
			xmlns:xhtml="http://www.w3.org/1999/xhtml"
			xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
		>
			${urls}
		</urlset>`.trim(),
		{
			headers: {
				'Content-Type': 'application/xml'
			}
		}
	)
}
