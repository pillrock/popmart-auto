import { Browser, ConnectOptions } from 'rebrowser-puppeteer-core';

import { connect, PageWithCursor } from 'puppeteer-real-browser';
import { Options } from 'puppeteer-real-browser';
export declare abstract class BrowserCustom extends Browser {
  private originalBrowser: Browser;

  constructor(browser: Browser) {
    super();
    this.originalBrowser = browser;
  }
  abstract newPage(): Promise<PageWithCursor>;
  /**
   * Gets all active {@link Target | targets}.
   *
   * In case of multiple {@link BrowserContext | browser contexts}, this returns
   * all {@link Target | targets} in all
   * {@link BrowserContext | browser contexts}.
   */
}

export async function customConnect(
  options: Options
): Promise<{ browser: BrowserCustom; page: PageWithCursor }> {
  const { browser, page } = await connect(options);
  const customBrowser = new BrowserCustom(browser);
  return { browser: customBrowser, page };
}
