import { generateRss } from '$lib/feed';

export const prerender = true;

export function GET() {
  return new Response(generateRss('en'), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
