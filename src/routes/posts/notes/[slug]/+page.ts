import { loadNotes, findRelated } from "$lib/posts";

export function entries() {
    const notes = loadNotes('en')
    return notes.map(note => ({ slug: note.slug }))
}

export function load({params}) {
    const notes = loadNotes('en')
    const note = notes.find(note => note.slug === params.slug)
    return { post: note, related: note ? findRelated(note, notes) : [] }
}