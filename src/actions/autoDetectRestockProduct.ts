import BrowserManager from '../browser';
import { LOCATOR } from '../constants/locator';
import delay from '../utils/delay';
import PaymentProcessor from './paymentProcessor';
import type { Page } from 'rebrowser-puppeteer-core';
import { index___product } from '../ipcMain/BrowserControl';
import MailService from '../utils/sendmail';
import { localStorage } from '../main';
import { STATUS_PRODUCT } from '../constants';

interface DataProduct {
  page: Page;
  linkProduct: string;
  imgUrl: string;
  price: string;
  nameProduct: string;
}
interface productStatusCheck {
  linkProduct: string;
  status: string;
  remove?: boolean;
}
export default class AutoDetectRestockProduct {
  private browserManager: BrowserManager | null;
  private productsList: DataProduct[] = [];

  constructor(browserManager: BrowserManager) {
    this.browserManager = browserManager;
  }

  async start(callback: (data: productStatusCheck) => void) {
    if (!this.browserManager) {
      return { success: false, message: 'Trình duyệt chưa được khởi tạo.' };
    }

    const runningTasks = new Map<string, Promise<void>>(); // key = linkProduct

    const processProduct = async (product: any) => {
      try {
        if (product.page.isClosed()) {
          this.productsList = this.productsList.filter((p) => p !== product);
          return;
        }

        callback({
          linkProduct: product.linkProduct,
          status: STATUS_PRODUCT.checking,
        });

        const pageProduct = product.page;
        const paymentProcessor = new PaymentProcessor(pageProduct);

        const { success, message } = await this.checkProductStock(pageProduct);
        callback({ linkProduct: product.linkProduct, status: message });

        if (success) {
          console.log(
            `[Auth] Chuyển page cần xác thực sang main window: ${pageProduct.url()}`
          );
          callback({
            linkProduct: product.linkProduct,
            status: STATUS_PRODUCT.detect,
          });
          await pageProduct.bringToFront();
          await this.clickBuyButton(pageProduct);
          callback({
            linkProduct: product.linkProduct,
            status: STATUS_PRODUCT.verifying,
          });
          await paymentProcessor.confirmBeforePayment();
          callback({
            linkProduct: product.linkProduct,
            status: STATUS_PRODUCT.verifySuccess,
          });
          try {
            await pageProduct.waitForNavigation({
              waitUntil: 'networkidle0',
              timeout: 15000,
            });
          } catch (error) {
            console.log('Navigation timeout, continuing...');
          }
          callback({
            linkProduct: product.linkProduct,
            status: STATUS_PRODUCT.checking_error,
          });

          const hasPaymentError =
            await paymentProcessor.hasPaymentError(pageProduct);
          if (hasPaymentError) {
            await pageProduct.close();
            this.productsList = this.productsList.filter((p) => p !== product);
            callback({
              linkProduct: product.linkProduct,
              status:
                STATUS_PRODUCT.errorPayment + ', xóa sản phẩm sau 10 giây',
              remove: true,
            });
            return;
          }

          callback({
            linkProduct: product.linkProduct,
            status: STATUS_PRODUCT.sendingMail,
          });
          const mailService = new MailService(
            localStorage.getUserData().emailRecieveNoti
          );
          const { page, linkProduct, ...dataReq } = product;
          await mailService.sendMail({
            emailAccount: localStorage.getUserData().email,
            ...dataReq,
          });
          callback({
            linkProduct: product.linkProduct,
            status: STATUS_PRODUCT.sentMail,
          });
          await delay(2000);

          // Hoàn tất -> loại khỏi danh sách
          this.productsList = this.productsList.filter((p) => p !== product);
          callback({
            linkProduct: product.linkProduct,
            status: 'HOÀN TẤT ĐẶT HÀNG, xóa sản phẩm sau 10 giây',
            remove: true,
          });
        } else {
          await this.browserManager.reloadPage(pageProduct);
        }
      } catch (err) {
        console.error(`[-] Lỗi sản phẩm ${product.linkProduct}:`, err);
        this.productsList = this.productsList.filter((p) => p !== product);
      }
    };

    try {
      while (this.productsList.length > 0) {
        console.log(
          `[AutoDetect] Đang chạy với ${this.productsList.length} sản phẩm`
        );

        for (const product of [...this.productsList]) {
          // Nếu product chưa chạy task nào thì bắt đầu xử lý
          if (!runningTasks.has(product.linkProduct)) {
            const task = processProduct(product)
              .catch((err) => console.error(err))
              .finally(() => runningTasks.delete(product.linkProduct)); // cleanup khi xong
            runningTasks.set(product.linkProduct, task);
          }
        }

        // chờ đi người đẹp
        await delay(2000);
      }

      // Chờ tất cả task còn lại xong hẳn
      await Promise.allSettled(runningTasks.values());
    } finally {
      await this.cleanup();
    }
  }

  async cleanup() {
    for (const product of this.productsList) {
      const page = product.page;
      try {
        if (!page.isClosed()) await page.close();
      } catch (error) {
        console.error('[-] Lỗi khi đóng trang:', error);
      }
    }
    this.productsList = [];
  }

  async addProduct(product: { linkProduct: string }): Promise<{
    success: boolean;
    message: string;
    dataProduct?: index___product;
  }> {
    if (!this.browserManager) {
      return { success: false, message: 'Trình duyêt chưa được khởi tạo' };
      // throw new Error('[-] Trình duyệt chưa được khởi tạo.');
    }
    try {
      const productPage = await this.browserManager.openPage(
        product.linkProduct
      );
      // this.productPages.push(productPage);

      const dataProduct = await this.getProductData(productPage);
      this.productsList.push({
        linkProduct: product.linkProduct,
        imgUrl: dataProduct.imgUrl,
        nameProduct: dataProduct.nameProduct,
        price: dataProduct.price,
        page: productPage,
      });
      return {
        success: true,
        message: 'Mở sản phẩm thành công',
        dataProduct: {
          ...dataProduct,
          linkProduct: product.linkProduct,
          page: productPage,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Mở sản phẩm thất bại, lỗi: [ ' + error?.message + ' ]',
      };
    }
  }
  async getProductData(page: Page) {
    const imgUrl = await page.$eval(LOCATOR.PRODUCT.IMAGE_SRC, (img) =>
      img.getAttribute('src')
    );
    const nameProduct = await page.$eval(
      LOCATOR.PRODUCT.NAME,
      (el) => el.textContent
    );
    const price = await page.$eval(
      LOCATOR.PRODUCT.PRICE,
      (el) => el.textContent
    );
    return { imgUrl, nameProduct, price };
  }

  async checkProductStock(
    page: Page
  ): Promise<{ success: boolean; message: string }> {
    try {
      const buyButton = await page.$(LOCATOR.PRODUCT.BUY_BUTTON);
      const outOfStock = await page.$(LOCATOR.PRODUCT.OUT_OF_STOCK);

      if (buyButton) {
        console.log('[+] Sản phẩm có sẵn để mua');
        return { success: true, message: 'Sản phẩm có sẵn để mua' };
      } else if (outOfStock) {
        console.log('[+] Sản phẩm hết hàng.');

        return { success: false, message: 'Sản phẩm hết hàng' };
      } else {
        console.log('[+] Không xác định được trạng thái sản phẩm');
        return {
          success: false,
          message: 'Không xác định được trạng thái sản phẩm',
        };
      }
    } catch (error) {
      console.error('[-] Lỗi khi kiểm tra tình trạng hàng:', error);
      return {
        success: false,
        message: 'lỗi khi kiểm tra tình trạng hàng: ' + error?.message,
      };
    }
  }

  async clickBuyButton(page: Page) {
    try {
      await page.locator(LOCATOR.PRODUCT.BUY_BUTTON).click();
      console.log('[+] Đã click nút mua.');
      await page.waitForNavigation({
        waitUntil: ['networkidle0', 'domcontentloaded'],
      });
    } catch (error) {
      console.error('[-] Lỗi khi click nút mua:', error);
    }
  }

  getProducts() {
    return this.productsList;
  }

  clearProducts() {
    this.productsList = [];
  }
}
