import { load } from 'cheerio';
import { ofetch } from 'ofetch';

export const route = {
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

    const html = await ofetch(newsUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-GB,en;q=0.9',
        },
    });

    const $ = load(html);
    const items = [];

    // The Scouts news listing uses article cards — selector may need adjusting
    // after inspecting live markup. Common patterns tried in order of likelihood.
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

        // Title — try heading elements first, then any link text
        const titleEl = card.find('h2, h3, h4').first();
        const title = titleEl.text().trim();

        // Link — prefer anchor wrapping the heading, fall back to any anchor
        let link = titleEl.find('a').attr('href') || card.find('a').first().attr('href');
        if (!link) {
            return; // skip if no link found
        }
        if (!link.startsWith('http')) {
            link = `${baseUrl}${link}`;
        }

        // Date — look for time element or text matching date pattern
        const timeEl = card.find('time');
        let pubDate;
        if (timeEl.length) {
            pubDate = timeEl.attr('datetime') || timeEl.text().trim();
        } else {
            // Fall back: look for text matching "DD Month YYYY" or "Nth Month YYYY"
            const datePattern = /\d{1,2}(?:st|nd|rd|th)?\s+\w+\s+\d{4}/i;
            const cardText = card.text();
            const match = cardText.match(datePattern);
            if (match) {
                pubDate = match[0];
            }
        }

        // Category/type label (News | Blog | Updates)
        const label = card.find('[class*="label"], [class*="tag"], [class*="category"]').first().text().trim();

        // Description — meta description or excerpt text
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