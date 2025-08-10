import { LOCATOR } from '../constants/index';
import type { Page } from 'rebrowser-puppeteer-core';
import BrowserManager from '../browser';

export default class LoginEmailPassword {
  private url = 'https://www.popmart.com/jp/user/login?redirect=%2Faccount';
  private browserManager: BrowserManager;
  private page: Page | null = null;

  constructor(browserManager: BrowserManager) {
    this.browserManager = browserManager;
  }

  async runLogin(
    email: string,
    password: string
  ): Promise<{ success: boolean; message: string }> {
    if (!this.browserManager) {
      throw new Error('[-] Trình duyệt chưa được khởi tạo');
    }
    this.page = await this.browserManager.openPage(this.url);
    await this.page.waitForNavigation({ waitUntil: 'load' });
    await this.page.locator('.index_siteCountry___tWaj').click();

    // Chờ và click nút chấp nhận chính sách
    await this.page.locator('.policy_acceptBtn__ZNU71').click();

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
      // Xử lý trường hợp không redirect
    }

    const errorPassword = await this.page.$(LOCATOR.LOGIN.ERROR_PASSWORD);
    if (errorPassword) {
      await this.destroyPage();
      return { success: false, message: msgFalse + 'Mật khẩu không chính xác' };
    }

    await this.destroyPage();
    return { success: true, message: 'Đăng nhập thành công' };
  }

  async destroyPage(): Promise<void> {
    try {
      if (this.page && !this.page.isClosed()) await this.page.close();
      console.log('[+] Trang đăng nhập đã được đóng.');
    } catch (error) {
      console.error('[-] Lỗi khi đóng trang:', error);
    }
  }
}
