import { loadNotes, loadPosts } from '$lib/posts'

export const prerender = true

async function formatContent(lang: string) {
    const posts = await loadPosts(lang)
    const notes = await loadNotes(lang)
    return posts.map(post => `posts/${post.slug}`).concat(notes.map(note => `posts/notes/${note.slug}`))
}
async function gen(target: string, alternate: string) {
    const siteUrl = 'https://zevarc.com';

    const fixUrls = ['', 'posts', 'projects']
    const contents = await formatContent(target)
    const alternateContents = await formatContent(alternate)

    const urls = fixUrls.concat(contents)
    const alternateUrls = fixUrls.concat(alternateContents)
    const sitemap = urls.map(url => {
        const origin = 'en' == target ? `${siteUrl}/${url}` : `${siteUrl}/${target}/${url}`
        const alternateUrl = 'en' == alternate ? `${siteUrl}/${url}` : `${siteUrl}/${alternate}/${url}`
        return `
                <url>
                <loc>${origin}</loc>
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
    }).join('')
    return sitemap
}
export async function GET(p) {
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
    );
}