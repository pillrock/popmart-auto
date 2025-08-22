import { LOCATOR } from '../constants/index';
import type { Page } from 'rebrowser-puppeteer-core';
import BrowserManager from '../browser';
import log from 'electron-log';
import delay from '../utils/delay';

export default class LoginEmailPassword {
  private url = 'https://www.popmart.com/jp/user/login?redirect=%2Faccount';
  private browserManager: BrowserManager;
  private page: Page | null = null;

  constructor(browserManager: BrowserManager) {
    this.browserManager = browserManager;
  }

  async runLogin(
    email: string,
    password: string,
    isManual: boolean
  ): Promise<{ success: boolean; message: string }> {
    if (!this.browserManager) {
      throw new Error('[-] Trình duyệt chưa được khởi tạo');
    }
    if (isManual) {
      this.page = await this.browserManager.openPage(this.url);
      return {
        success: true,
        message: 'Có 45 giây cho quá trình đăng nhập thủ công',
      };
    }
    this.page = await this.browserManager.openPage(this.url);

    await this.page.waitForNavigation({ waitUntil: 'load' });

    try {
      await this.page.waitForSelector(LOCATOR.LOGIN.CONTAINER_COUNTRY, {
        timeout: 6000,
      });
      await this.page.locator(LOCATOR.LOGIN.MODALCOUNTRY_CLOSE).click();
    } catch (error) {
      if (error.name === 'TimeoutError') {
        log.info('Server đã ở nhật ban');
      }
    }

    try {
      // Chờ và click nút chấp nhận chính sách
      await this.page.locator(LOCATOR.LOGIN.ACCEPT_POLICY).click();

      await this.page.locator(LOCATOR.LOGIN.EMAIL).fill(email);
      await this.page.locator(LOCATOR.LOGIN.AGREEMENT).click();
      await this.page.locator(LOCATOR.LOGIN.BUTTON_NEXT_STEP).click();

      const msgFalse = 'Đăng nhập thất bại - ';

      // handle error step 1 (mail error)
      const errorEmail = await this.page.$(LOCATOR.LOGIN.ERROR_EMAIL);
      if (errorEmail) {
        await this.destroyPage();
        return { success: false, message: msgFalse + 'Email không hợp lệ' };
      }

      await this.page.locator(LOCATOR.LOGIN.PASSWORD).fill(password);
      await this.page.locator(LOCATOR.LOGIN.BUTTON_SUBMIT).click();

      try {
        await this.page.waitForNavigation({
          waitUntil: 'networkidle0',
          timeout: 45000,
        });
      } catch (error) {
        return {
          success: false,
          message:
            msgFalse + 'Lỗi khi chờ điều hướng, dừng trình duyệt và mở lại',
        };
      }

      const errorPassword = await this.page.$(LOCATOR.LOGIN.ERROR_PASSWORD);
      if (errorPassword) {
        await this.destroyPage();
        return {
          success: false,
          message: msgFalse + 'Mật khẩu không chính xác',
        };
      }

      await this.destroyPage();
      return { success: true, message: 'Đăng nhập thành công' };
    } catch (error) {
      log.error('Lỗi trong quá trình đăng nhập:', error.message);
      await this.destroyPage();
      return {
        success: false,
        message: 'Đăng nhập thất bại - ' + error.message,
      };
    }
  }

  async destroyPage(): Promise<void> {
    try {
      if (this.page && !this.page.isClosed()) await this.page.close();
      log.info('[+] Trang đăng nhập đã được đóng.');
    } catch (error) {
      console.error('[-] Lỗi khi đóng trang:', error);
    }
  }
}
