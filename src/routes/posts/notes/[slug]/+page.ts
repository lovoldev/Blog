import { loadNotes } from "$lib/posts";

export function entries() {
    const notes = loadNotes('en')
    return notes.map(note => ({ slug: note.slug }))
}

export function load({params}) {
    const notes = loadNotes('en')
    return { post: notes.find(note => note.slug === params.slug) }
}