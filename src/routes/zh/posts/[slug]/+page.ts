import { loadPosts, findRelated } from "$lib/posts";

export function entries() {
    const posts = loadPosts('zh')
    return posts.map(post => ({ slug: post.slug }))
}

export function load({params}) {
    const posts = loadPosts('zh')
    const post = posts.find(post => post.slug === params.slug)
    return { post, related: post ? findRelated(post, posts) : [] }
}