import type { Route } from '@/types';
import { load } from 'cheerio';
import { ofetch } from 'ofetch';

export const route: Route = {
    path: '/blog',
    name: 'Blog',
    url: 'girlguiding.org.uk',
    maintainers: ['iyvs'],
    handler,
    description: 'Latest blog posts and news from Girlguiding UK.',
};

async function handler() {
    const baseUrl = 'https://www.girlguiding.org.uk';
    const blogUrl = `${baseUrl}/what-we-do/blog/`;

    let html: string;

    try {
        html = await ofetch(blogUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-GB,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
            },
        });
    } catch {
        // If ofetch fails, fall back to debug response so we can diagnose
        return {
            title: 'Girlguiding UK — Blog (fetch failed)',
            link: blogUrl,
            description: 'Failed to fetch page — may need Puppeteer',
            item: [],
        };
    }

    const $ = load(html);

    // TEMPORARY DEBUG — remove before production
    return {
        title: 'DEBUG — Girlguiding',
        link: blogUrl,
        description: 'debug',
        item: [{
            title: 'HTML dump',
            link: blogUrl,
            description: $.html().substring(0, 5000),
        }],
    };
}
