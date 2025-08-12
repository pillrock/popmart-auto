import type { Browser, Page } from 'rebrowser-puppeteer-core';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

export default class BrowserManager {
  private browser: Browser | null;
  public initPage: Page | null;
  private pages: Page[];
  constructor() {
    this.browser = null;
    this.initPage = null;
    this.pages = [];
  }
  async start() {
    const { connect } = await import('puppeteer-real-browser');

    const { browser, page } = await connect({
      headless: false,
      args: [
        '--window-size=600,500',
        '--window-position=0,0',
        '--disable-features=site-per-process',
      ],
      customConfig: {},
      turnstile: true,
      connectOption: {},
      disableXvfb: false,
      ignoreAllFlags: false,
      plugins: [StealthPlugin()],
    });

    this.browser = browser;
    this.initPage = page;
  }
  async openPage(url: string) {
    if (!this.browser) {
      throw new Error(
        '[-] Trình duyệt chưa được khởi tạo, hãy gọi start() trước'
      );
    }

    const page = await this.browser.newPage();
    this.pages.push(page);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    return page;
  }

  async reloadPage(page: Page) {
    if (!page || page.isClosed()) {
      throw new Error('[-] Trang không tồn tại hoặc đã đóng');
    }

    try {
      await page.reload({
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 60000,
      });
      return true;
    } catch (error: unknown) {
      console.error('Reload trang thất bại:', error);
      await page.close();
      throw error;
    }
  }
  async close() {
    if (this.browser) await this.browser.close();
  }
}
