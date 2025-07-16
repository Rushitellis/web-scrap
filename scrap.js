const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const readline = require('readline');
const fs = require('fs');

puppeteer.use(StealthPlugin());

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.question('Enter product name to search on Amazon.in: ', async (productName) => {
    rl.close();

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    );

    const searchQuery = productName.replace(/\s+/g, '+');

    await page.goto(`https://www.amazon.in/s?k=${searchQuery}`, {
        waitUntil: 'domcontentloaded',
    });

    await new Promise(resolve => setTimeout(resolve, 7000));


    await page.waitForSelector('.s-main-slot.s-result-list.s-search-results.sg-row .s-result-item', { timeout: 15000 });

    const firstNodeHTML = await page.$$eval(
        '.s-main-slot.s-result-list.s-search-results.sg-row > .s-result-item',
        nodes => nodes[0]?.innerHTML || 'No node found'
    );
    console.log('First product raw HTML snippet (first 1000 chars):\n', firstNodeHTML.substring(0, 1000), '\n---');

    const products = await page.$$eval(
        '.s-main-slot.s-result-list.s-search-results.sg-row > .s-result-item',
        (nodes) =>
            nodes
                .slice(0, 15)
                .map((node) => {
                    const linkEl = node.querySelector('a[href]');

                    const titleSpanEl = node.querySelector('h2 a span.a-size-medium.a-color-base.a-text-normal');
                    const titleFallbackEl = node.querySelector('h2 a');
                    const h2AriaLabelEl = node.querySelector('h2[aria-label]');


                    let title = 'No title';
                    if (titleSpanEl && titleSpanEl.innerText) {
                        title = titleSpanEl.innerText.trim();
                    } else if (titleFallbackEl && titleFallbackEl.innerText) {
                        title = titleFallbackEl.innerText.trim();
                    } else if (h2AriaLabelEl && h2AriaLabelEl.getAttribute('aria-label')) {
                        title = h2AriaLabelEl.getAttribute('aria-label').trim();
                    }


                    const priceWholeEl = node.querySelector('.a-price-whole');
                    const priceFractionEl = node.querySelector('.a-price-fraction');

                    let price = 'No price';
                    if (priceWholeEl) {
                        price = priceWholeEl.innerText.trim();
                        if (priceFractionEl) {
                            price += priceFractionEl.innerText.trim();
                        }
                    }

                    const link = linkEl ? 'https://www.amazon.in' + linkEl.getAttribute('href') : 'No link';

                    return {
                        title: title,
                        price: price,
                        link: link,
                    };
                })
    );

    console.log("Extracted products:", products.map(p => p.title));
    const filename = `results_${productName.replace(/\s+/g, '_').toLowerCase()}.json`;
    fs.writeFileSync(filename, JSON.stringify(products, null, 2));

    console.log(`Scraped ${products.length} results. Saved to ${filename}`);

    await browser.close();
});