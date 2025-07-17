const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cors = require('cors');

puppeteer.use(StealthPlugin());

const app = express();
app.use(cors());
app.use(express.json());

app.get('/scrape', async (req, res) => {
  const productName = req.query.q;
  if (!productName) return res.status(400).json({ error: 'Missing search query' });

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0.0.0 Safari/537.36'
    );

    const searchQuery = productName.replace(/\s+/g, '+');
    await page.goto(`https://www.amazon.in/s?k=${searchQuery}`, { waitUntil: 'domcontentloaded' });

    // Use setTimeout instead of waitForTimeout for compatibility
    await new Promise(resolve => setTimeout(resolve, 5000));

    const products = await page.$$eval('.s-main-slot .s-result-item', (nodes) =>
      nodes.slice(0, 10).map((node) => {
        const title = node.querySelector('h2')?.innerText?.trim() || 'No title';
        const price = node.querySelector('.a-price-whole')?.innerText?.trim() || 'No price';
        const link = node.querySelector('a')?.href || 'No link';
        return { title, price, link };
      })
    );

    await browser.close();
    return res.json(products);
  } catch (err) {
    console.error('Scraping error:', err);
    return res.status(500).json({ error: 'Scraping failed' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🧠 Puppeteer server running on http://localhost:${PORT}`);
});
