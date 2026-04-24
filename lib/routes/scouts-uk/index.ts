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
    const items: object[] = [];

    const cardSelectors = [
        'article',
        '.news-listing__item',
        '.card',
        '[class*="news-item"]',
        '[class*="article-card"]',
    ];

    let cards = $();
    for (const sel of cardSelectors) {
        cards = $(sel);
        if (cards.length > 0) {
            break;
        }
    }

    cards.each((_, el) => {
        const card = $(el);

        const titleEl = card.find('h2, h3, h4').first();
        const title = titleEl.text().trim();

        let link = titleEl.find('a').attr('href') || card.find('a').first().attr('href');
        if (!link) {
            return;
        }
        if (!link.startsWith('http')) {
            link = `${baseUrl}${link}`;
        }

        const timeEl = card.find('time');
        let pubDate: string | undefined;
        if (timeEl.length) {
            pubDate = timeEl.attr('datetime') || timeEl.text().trim();
        } else {
            const datePattern = /\d{1,2}(?:st|nd|rd|th)?\s+\w+\s+\d{4}/i;
            const match = card.text().match(datePattern);
            if (match) {
                pubDate = match[0];
            }
        }

        const label = card.find('[class*="label"], [class*="tag"], [class*="category"]').first().text().trim();
        const description = card.find('p').first().text().trim();

        if (title && link) {
            items.push({
                title: label ? `[${label}] ${title}` : title,
                link,
                description,
                pubDate,
            });
        }
    });

    return {
        title: 'Scouts UK — News',
        link: newsUrl,
        description: 'Latest news, updates and blog posts from The Scout Association.',
        item: items,
    };
}