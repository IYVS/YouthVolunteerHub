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

    const items = $('div.teaser-block--ltr').map((_i, el) => {
        const a = $(el).find('a.teaser-block__link');
        const title = $(el).find('span.teaser-block__title-text').text().trim();
        const href = a.attr('href') ?? '';
        const link = href.startsWith('http') ? href : `${baseUrl}${href}`;
        const linkTexts = $(el).find('p.teaser-block__linktext');
        const date = linkTexts.eq(0).text().trim();
        const description = linkTexts.eq(1).text().trim();

        return { title, link, description, pubDate: date };
    }).get();

    return {
        title: 'Girlguiding Blog',
        link: blogUrl,
        description: 'Latest blog posts and news from Girlguiding UK.',
        item: items,
    };
}