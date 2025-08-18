// 4848 0410 3292 4955
// 1129
// 678
import log from 'electron-log';

import { LOCATOR } from '../constants/index';
import delay from '../utils/delay';
// import type { PageWithCursor as Page } from 'puppeteer-real-browser';
import { TimeoutError, type Page } from 'rebrowser-puppeteer-core';

type paymentInfo = {
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
};

export default class PaymentProcessor {
  private page: Page | null;
  constructor(page: Page) {
    this.page = page;
  }
  // async processPayment(paymentInfo: paymentInfo) {
  //   if (!this.page || !paymentInfo) {
  //     throw new Error('[-] Trang hoặc thông tin thanh toán không hợp lệ.');
  //   }
  //   try {
  //     // Chờ và click nút chuyển tới trang thanh toán
  //     await this.confirmBeforePayment();
  //     await delay(3000);

  //     // await this.handleCloudflareVerification();

  //     await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
  //     await delay(5000);

  //     // Điền thông tin thanh toán
  //     await delay(2000);
  //     await this.#fillPaymentForm(paymentInfo);
  //     await delay(1000);
  //     // Gửi thông tin thanh toán
  //     await this.submitPayment();

  //     const isE = await this.hasPaymentError(this.page);
  //     if (!isE) {
  //       console.log('[-] Thanh toán thất bại');
  //       return;
  //     }
  //     console.log('[+] Thanh toán đã được xử lý thành công.');
  //   } catch (error) {
  //     console.error('[-] Lỗi khi xử lý thanh toán:', error);
  //     throw new Error('[-] Thanh toán không thành công.');
  //   }
  // }
  async handleCloudflareVerification() {
    try {
      log.info('[+] Đang kiểm tra Cloudflare verification...');
      // Đợi tối đa 10 giây để kiểm tra xem có Cloudflare box không
      const boxVerify = await this.page
        .waitForSelector('.index_cloudflareBox__9zYYt', { timeout: 10000 })
        .catch();

      if (boxVerify) {
        log.info('[+] Đang xác thực Cloudflare...');

        // Đợi Cloudflare box biến mất (tối đa 60 giây)
        await this.page.waitForFunction(
          (selector) => !document.querySelector(selector),
          { timeout: 60000 },
          '.index_cloudflareBox__9zYYt'
        );

        log.info('[+] Xác thực Cloudflare thành công.');
      } else {
        log.info('[+] Không có Cloudflare verification, tiếp tục...');
      }
    } catch (error) {
      console.warn('[!] Cảnh báo khi xử lý Cloudflare:', error.message);
      // Không throw error ở đây, chỉ log warning và tiếp tục
    }
  }
  //   async confirmBeforePayment() {
  //   try {
  //     const button = await this.page.waitForSelector(
  //       LOCATOR.PAYMENT.BUTTON_BEFORE_PAYMENT,
  //       { timeout: 15000 }
  //     );
  //     if (!button) {
  //       throw new Error('[-] Nút chuyển trang không được tìm thấy sau thời gian chờ.');
  //     }
  //     log.info('[+] Đã tìm thấy nút chuyển trang.');

  //     await this.page.locator(LOCATOR.PAYMENT.BUTTON_BEFORE_PAYMENT).click();

  //     let boxVerify: any = null;
  //     try {
  //       boxVerify = await this.page.waitForSelector('.index_cloudflareBox__9zYYt', {
  //         timeout: 6000,
  //       });
  //     } catch {
  //       log.info('[+] Không có Cloudflare verification, tiếp tục...');
  //     }

  //     if (boxVerify) {
  //       log.info('[+] Đang xác thực Cloudflare...');
  //       await this.page.waitForFunction(
  //         (selector) => !document.querySelector(selector),
  //         { timeout: 15000 },
  //         '.index_cloudflareBox__9zYYt'
  //       );
  //       log.info('[+] Xác thực Cloudflare thành công.');
  //     }

  //   } catch (error: any) {
  //     console.error('[-] Lỗi khi chuyển tới trang thanh toán:', error.message);
  //   }
  // }

  async confirmBeforePayment() {
    try {
      // nút chuyển tới thanh toán
      const button = await this.page.waitForSelector(
        LOCATOR.PAYMENT.BUTTON_BEFORE_PAYMENT,
        { timeout: 15000 }
      );
      if (!button) {
        throw new Error(
          '[-] Nút chuyển trang không được tìm thấy sau thời gian chờ.'
        );
      }
      log.info('[+] Đã tìm thấy nút chuyển trang.');
      let boxVerify = null;
      try {
        while (boxVerify === null) {
          const confirmBTN = await this.page.waitForSelector(
            LOCATOR.PAYMENT.BUTTON_BEFORE_PAYMENT,
            { timeout: 1000 }
          );
          if (!confirmBTN) {
            break;
          }
          await this.page
            .locator(LOCATOR.PAYMENT.BUTTON_BEFORE_PAYMENT)
            .click();
          try {
            boxVerify = await this.page.waitForSelector(
              '.index_cloudflareBox__9zYYt',
              { timeout: 6000 }
            );
            break;
          } catch (error) {
            if (error.name === 'TimeoutError') {
              log.info('Không tìm thấy phần tử sau 6 giây.');
            }
          }
          await delay(500);
        }
      } catch (error) {
        console.log('er#34232: ', error.message);
      }
      if (boxVerify) {
        log.info('[+] Đang xác thực Cloudflare...');

        await this.page.waitForFunction(
          (selector) => !document.querySelector(selector),
          { timeout: 10000 },
          '.index_cloudflareBox__9zYYt'
        );

        log.info('[+] Xác thực Cloudflare thành công.');
      } else {
        log.info('[+] Không có Cloudflare verification, tiếp tục...');
      }
    } catch (error) {
      console.error('[-] Lỗi khi chuyển tới trang thanh toán:', error);
      // throw new Error('[-] Xác nhận thanh toán không thành công.');
    }
  }
  // async #fillPaymentForm({ cardNumber, cardExpiry, cardCvc }: paymentInfo) {
  //   try {
  //     // Thử tìm trong iframe
  //     let is_finding = true;
  //     while (is_finding) {
  //       console.log('[+] Đang tìm form trong iframe...');
  //       const frames = await this.page.frames();
  //       for (const frame of frames) {
  //         try {
  //           const cardElement = await frame.$(LOCATOR.PAYMENT.CARD_NUMBER);
  //           if (cardElement) {
  //             is_finding = false;
  //             console.log('[+] Tìm thấy form trong iframe');
  //             await frame.locator(LOCATOR.PAYMENT.CARD_NUMBER).fill(cardNumber);
  //             await frame.locator(LOCATOR.PAYMENT.CARD_EXPIRY).fill(cardExpiry);
  //             await frame.locator(LOCATOR.PAYMENT.CARD_CVC).fill(cardCvc);

  //             // Agreement có thể ở page chính hoặc iframe
  //             const agreementInFrame = await frame.$(LOCATOR.PAYMENT.AGREEMENT);
  //             if (agreementInFrame) {
  //               await frame.locator(LOCATOR.PAYMENT.AGREEMENT).click();
  //             } else {
  //               await this.page.locator(LOCATOR.PAYMENT.AGREEMENT).click();
  //             }

  //             return;
  //           }
  //         } catch (frameError) {
  //           // Bỏ qua frame này, thử frame tiếp theo
  //           is_finding = false;
  //         }
  //       }
  //       await delay(1500);
  //     }

  //     console.log('[+] Đã điền thông tin thẻ thanh toán.');
  //   } catch (error) {
  //     console.error('[-] Lỗi khi điền thông tin thanh toán:', error);
  //     throw new Error('[-] Điền thông tin thanh toán không thành công.');
  //   }
  // }

  async hasPaymentError(pageProduct: Page): Promise<boolean> {
    let countCheck = 0;
    try {
      // Kiểm tra URL thành công trước tiên
      while (countCheck < 3) {
        const currentUrl = await pageProduct.url();
        if (currentUrl.includes('/checkout?type=normal')) {
          return false;
        } else if (currentUrl.includes('/order-confirmation')) {
          return true;
        }
        countCheck++;
        await delay(3000);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      return false;
    }
  }
  async submitPayment() {
    try {
      await this.page.locator(LOCATOR.PAYMENT.BUTTON_SUBMIT).click();
      console.log('[+] Đã gửi thông tin thanh toán.');
    } catch (error) {
      console.error('[-] Lỗi khi gửi thông tin thanh toán:', error);
      throw new Error('[-] Gửi thông tin thanh toán không thành công.');
    }
  }
}
