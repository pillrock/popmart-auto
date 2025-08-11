import BrowserManager from '../browser';
import { LOCATOR } from '../constants/locator';
import delay from '../utils/delay';
import PaymentProcessor from './paymentProcessor';
import type { Page } from 'rebrowser-puppeteer-core';
import { index___product } from '../ipcMain/BrowserControl';
import MailService from '../utils/sendmail';
import { localStorage } from '../main';
import { STATUS_PRODUCT } from '../constants';
import { ElementHandle } from 'rebrowser-puppeteer-core';
import log from 'electron-log';

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

    const processProduct = async (product: DataProduct) => {
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
          log.info(
            `[Auth] Chuyển page cần xác thực sang main window: ${pageProduct.url()}`
          );
          callback({
            linkProduct: product.linkProduct,
            status: STATUS_PRODUCT.detect,
          });
          await pageProduct.bringToFront();
          const resultOrder = await this.selectOptionsOfOrder(pageProduct);

          const newDataProduct = await this.getProductData(pageProduct);
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
            log.info('Navigation timeout, continuing...');
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
              status: STATUS_PRODUCT.errorPayment + ', xóa sản phẩm sau 5 giây',
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
            resultOrder,
            price: newDataProduct.price,
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
            status: 'HOÀN TẤT ĐẶT HÀNG, xóa sản phẩm sau 5 giây',
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
        log.info(
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
  async selectOptionsOfOrder(page: Page) {
    const resultOrder: { option: 'one' | 'box'; quantity: number } = {
      option: 'one',
      quantity: 0,
    };
    log.info('_______THAO TÁC LỰA CHỌN _______');

    const checkDisableBox = async (element: ElementHandle<Element>) => {
      const isDisabled = await element.evaluate(
        (el, locator) => el.matches(locator),
        LOCATOR.ORDER.DISABLE_BOX
      );
      log.info(`Kết quả kiểm tra box có bị vô hiệu hóa: ${isDisabled}`);
      return isDisabled;
    };

    const checkDisableBtn = async (element: ElementHandle<Element>) => {
      const isDisabled = await element.evaluate(
        (el, locator) => el.matches(locator),
        LOCATOR.ORDER.DISABLE_BTN
      );
      log.info(`Kết quả kiểm tra nút có bị vô hiệu hóa: ${isDisabled}`);
      return isDisabled;
    };

    const QuantityIsTwo = async () => {
      try {
        const result = await page.$eval(
          LOCATOR.ORDER.QUANTITY_ORDER,
          (el) => el.getAttribute('value').trim() === '2'
        );
        log.info(`Kết quả kiểm tra số lượng bằng 2: ${result}`);
        return result;
      } catch (error) {
        log.error(`Lỗi khi kiểm tra số lượng: ${error.message}`);
        return false;
      }
    };

    try {
      log.info(
        `Tìm kiếm hộp lựa chọn với selector: ${LOCATOR.ORDER.OPTIONS_BOX}`
      );

      /// nếu có lựa chọn HỘP thì sẽ ưu tiên lấy
      const selectsNox = await page.$$(LOCATOR.ORDER.OPTIONS_BOX);
      log.info(`Tìm thấy ${selectsNox.length} phần tử hộp lựa chọn`);

      if (selectsNox.length == 2) {
        log.info('Tìm thấy 2 hộp lựa chọn, kiểm tra hộp thứ 2 (HỘP)');
        const isDisabled = await checkDisableBox(selectsNox[1]);
        if (!isDisabled) {
          await selectsNox[1].click();
          resultOrder.option = 'box';
          log.info('Đã chọn HỘP');
        } else {
          log.info('HỘP bị vô hiệu hóa, không thể chọn');
        }
      } else if (selectsNox.length == 1) {
        log.info('Tìm thấy 1 hộp lựa chọn, kiểm tra hộp đầu tiên (CÁI)');
        const isDisabled = await checkDisableBox(selectsNox[0]);
        if (!isDisabled) {
          await selectsNox[0].click();
          log.info('Đã chọn CÁI');
          resultOrder.option = 'one';
        } else {
          log.info('CÁI bị vô hiệu hóa, không thể chọn');
        }
      } else {
        log.warn('Không tìm thấy hộp lựa chọn nào');
      }

      // Chờ một chút sau khi chọn option
      await delay(500);

      log.info(
        `Tìm kiếm nút tăng số lượng với selector: ${LOCATOR.ORDER.INCREASE_BTN}`
      );

      /**
       * mua với số lượng là 2 cho tất cả,
       * nếu không tăng lên được 2 thì mua 1
       */
      const selectsIncreaseBtn = await page.$$(LOCATOR.ORDER.INCREASE_BTN);
      log.info(`Tìm thấy ${selectsIncreaseBtn.length} nút tăng số lượng`);

      if (selectsIncreaseBtn.length >= 2) {
        const increaseBtn = selectsIncreaseBtn[1];
        log.info('Kiểm tra nút tăng số lượng có bị vô hiệu hóa không');

        const isBtnDisabled = await checkDisableBtn(increaseBtn);
        if (!isBtnDisabled) {
          log.info(
            'Nút tăng số lượng đã được kích hoạt, bắt đầu tăng số lượng'
          );
          let i = 1;
          while (i < 4) {
            log.info(`Click nút tăng số lượng, lần thử ${i}`);
            await increaseBtn.click();
            await delay(300);
            i++;

            if (await QuantityIsTwo()) {
              log.info('Số lượng đã đạt 2, dừng tăng');
              break;
            }
            log.info('Số lượng chưa tăng lên 2, tiếp tục ấn lên');
          }
          resultOrder.quantity = i;
          // xử lý khi shop chỉ tối đa 1 sản phẩm 1 người
          // khi đó i thì cứ cộng mà sản phẩm thực tế không tăng
          if (i == 4) {
            resultOrder.quantity = i;
          }
        } else {
          log.info('Nút tăng số lượng bị vô hiệu hóa, không thể tăng số lượng');
          resultOrder.quantity = 1;
        }
      } else {
        log.warn('Không tìm thấy đủ nút tăng số lượng (cần ít nhất 2)');
      }
      return resultOrder;
    } catch (error) {
      log.error('#kdjewif: lỗi khi lựa chọn đặt hàng: ', error.message);
      log.error('Chi tiết lỗi:', error.stack);
    } finally {
      log.info('_______________________');
    }
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
      log.info('______THAO TAC CHECK HÀNG TỒN_____');
      const buyButton = await page.$(LOCATOR.PRODUCT.BUY_BUTTON);
      const outOfStock = await page.$(LOCATOR.PRODUCT.OUT_OF_STOCK);

      if (buyButton) {
        log.info('[+] Sản phẩm có sẵn để mua');
        return { success: true, message: 'Sản phẩm có sẵn để mua' };
      } else if (outOfStock) {
        log.info('[+] Sản phẩm hết hàng.');

        return { success: false, message: 'Sản phẩm hết hàng' };
      } else {
        log.info('[+] Không xác định được trạng thái sản phẩm');
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
    } finally {
      log.info('_______________________');
    }
  }
  async clickBuyButton(page: Page) {
    try {
      log.info('______THAO TÁC MUA______');

      // Lặp tối đa 3 lần
      for (let i = 0; i < 5; i++) {
        const a = await page.$(LOCATOR.PRODUCT.BUY_BUTTON);
        if (a) {
          await a.click();
          if (i >= 1) {
            log.warn('[!] Trang chưa chuyển, click lại...');
          }
        } else {
          return;
        }
        await delay(1000);
      }
      log.error('[-] Đã click nhiều lần nhưng vẫn chưa chuyển trang.');
    } catch (error) {
      log.error('[-] Lỗi khi click nút mua:', error);
    } finally {
      log.info('_______________________');
    }
  }

  getProducts() {
    return this.productsList;
  }

  clearProducts() {
    this.productsList = [];
  }
}
