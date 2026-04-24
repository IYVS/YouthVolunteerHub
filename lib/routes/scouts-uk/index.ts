import type { Route } from '@/types';
import { load } from 'cheerio';
import puppeteer from '@/utils/puppeteer';

export const route: Route = {
    path: '/news',
    name: 'News',
    url: 'scouts.org.uk',
    maintainers: ['iyvs'],
    handler,
    description: 'Latest news, updates and blog posts from The Scout Association UK.',
};

async function handler() {
    const baseUrl = 'https://www.scouts.org.uk';
    const newsUrl = `${baseUrl}/news/`;

    const browser = await puppeteer();
    const page = await browser.newPage();

    await page.goto(newsUrl, { waitUntil: 'networkidle2' });
    const html = await page.content();
    await browser.close();

    const $ = load(html);

    // TEMPORARY DEBUG — remove before production
    return {
        title: 'DEBUG',
        link: newsUrl,
        description: 'debug',
        item: [{
            title: 'HTML dump',
            link: newsUrl,
            description: $.html().substring(0, 5000),
        }],
    };
}