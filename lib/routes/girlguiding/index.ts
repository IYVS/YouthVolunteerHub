import type { Element } from 'domhandler';
import type { Route } from '@/types';
import { load } from 'cheerio';
import { getPuppeteerPage } from '@/utils/puppeteer';

export const route: Route = {
    path: '/blog',
    name: 'Blog',
    url: 'girlguiding.org.uk',
    maintainers: ['iyvs'],
    handler,
    example: '/girlguiding/blog',
    description: 'Latest blog posts and news from Girlguiding UK.',
};

async function handler() {
    const baseUrl = 'https://www.girlguiding.org.uk';
    const blogUrl = `${baseUrl}/what-we-do/blog/`;

    const { page, destroy } = await getPuppeteerPage(blogUrl, { gotoConfig: { waitUntil: 'networkidle2' } });
    const html = await page.content();
    await destroy();

    const $ = load(html);

    return {
        title: 'DEBUG',
        link: blogUrl,
        description: 'debug',
        item: [{
            title: 'HTML dump',
            link: blogUrl,
            description: $.html().substring(0, 5000),
        }],
    };
}