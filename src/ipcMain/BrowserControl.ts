import { ipcMain, BrowserWindow } from 'electron';
import BrowserManager from '../browser';
import LoginEmailPassword from '../actions/loginEmailPassword';
import AutoDetectRestockProduct from '../actions/autoDetectRestockProduct';
import { ProductFull } from '../components/PopmartAutoContainer';
import { Page } from 'rebrowser-puppeteer-core';
interface ProductInfo {
  url: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}
export interface index___product extends ProductFull {
  page: Page;
}
export class BrowserControl {
  private browserManager: BrowserManager | null = null;
  private autoDetectService: AutoDetectRestockProduct | null = null;
  private mainWindow: BrowserWindow;
  private isLoggedIn = false;
  private products: index___product[] = [];

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.setupIPCHandlers();
  }

  private setupIPCHandlers(): void {
    // Khởi tạo trình duyệt
    ipcMain.handle('browser:init', async () => {
      try {
        if (!this.browserManager) {
          this.browserManager = new BrowserManager();
          await this.browserManager.start();

          this.autoDetectService = new AutoDetectRestockProduct(
            this.browserManager
          );

          this.sendToRenderer('browser:status', {
            status: 'initialized',
            message: 'Trình duyệt đã được khởi tạo thành công',
          });

          return { success: true, message: 'Browser initialized' };
        }
        return { success: true, message: 'Browser already initialized' };
      } catch (error) {
        console.error('Browser init error:', error);
        this.sendToRenderer('browser:status', {
          status: 'error',
          message: `Lỗi khởi tạo trình duyệt: ${error.message}`,
        });
        return { success: false, error: error.message };
      }
    });

    // Đăng nhập
    ipcMain.handle(
      'browser:login',
      async (_event, credentials: LoginCredentials) => {
        try {
          if (!this.browserManager) {
            throw new Error('Trình duyệt chưa được khởi tạo');
          }

          this.sendToRenderer('login:status', {
            status: 'processing',
            message: 'Đang đăng nhập...',
          });

          const loginService = new LoginEmailPassword(this.browserManager);
          this.isLoggedIn = true;
          return await loginService.runLogin(
            credentials.email,
            credentials.password
          );

          // this.sendToRenderer('login:status', {
          //   status,
          //   message,
          // });
        } catch (error) {
          // this.sendToRenderer('login:status', {
          //   status: 'error',
          //   message: `Lỗi đăng nhập: ${error.message}`,
          // });
          return {
            success: false,
            message: 'Lỗi không xác định - [' + error.message + ']',
          };
        }
      }
    );

    // Thêm sản phẩm
    ipcMain.handle('product:add', async (_event, product: index___product) => {
      try {
        if (!this.isLoggedIn) {
          return { success: false, message: 'Vui lòng đăng nhập trước' };
        }

        if (!this.autoDetectService) {
          return { success: false, message: 'Service chưa được khởi tạo' };
        }

        const res = await this.autoDetectService.addProduct(product);
        this.products.push(res.dataProduct);

        const { page, ...productDataWithoutPage } = res.dataProduct;
        return {
          success: true,
          message: 'Mở sản phẩm thành công',
          data: productDataWithoutPage,
        };
      } catch (error) {
        console.error('Add product error:', error);

        return {
          success: false,
          message: 'Lỗi không xác định: [' + error?.message + ']',
        };
      }
    });
    // Thêm sản phẩm
    ipcMain.handle(
      'product:add-more',
      async (_event, products: index___product[]) => {
        try {
          if (!this.isLoggedIn) {
            return { success: false, message: 'Vui lòng đăng nhập trước' };
          }

          if (!this.autoDetectService) {
            return { success: false, message: 'Service chưa được khởi tạo' };
          }
          const addProductPromise = products.map((product) =>
            this.autoDetectService.addProduct(product)
          );
          const dataProducts = (await Promise.all(addProductPromise)).map(
            (item) => {
              this.products.push(item.dataProduct);
              const { page, ...dataProductWithoutPage } = item.dataProduct;
              return dataProductWithoutPage;
            }
          );

          return {
            success: true,
            message: 'Mở tất cả sản phẩm thành công',
            data: dataProducts,
          };
        } catch (error) {
          console.error('Add product error:', error);

          return {
            success: false,
            message: 'Lỗi không xác định: [' + error?.message + ']',
          };
        }
      }
    );

    // Xóa sản phẩm
    ipcMain.handle('product:remove', async (_event, linkProduct: string) => {
      try {
        if (
          !this.products.some((product) => product.linkProduct === linkProduct)
        ) {
          return { success: true, message: 'Sản phẩm đã được xóa' };
        }
        for (let i = 0; i < this.products.length; i++) {
          const product = this.products[i];
          if (product.linkProduct == linkProduct) {
            this.products.splice(i, 1);
            if (!product.page.isClosed()) {
              await product.page.close();
            }
          }
        }

        return { success: true, message: 'Sản phẩm đã được xóa' };
      } catch (error) {
        console.error('Remove product error:', error);
        // this.sendToRenderer('product:status', {
        //   status: 'error',
        //   message: `Lỗi xóa sản phẩm: ${error.message}`,
        // });
        return { success: false, message: error.message };
      }
    });

    // Bắt đầu theo dõi
    ipcMain.handle('monitor:start', async () => {
      try {
        if (!this.autoDetectService) {
          throw new Error('Service chưa được khởi tạo');
        }

        if (this.products.length === 0) {
          throw new Error('Chưa có sản phẩm nào để theo dõi');
        }

        // this.sendToRenderer('monitor:status', {
        //   status: 'started',
        //   message: `Bắt đầu theo dõi ${this.products.length} sản phẩm`,
        // });

        // Chạy service trong background
        this.autoDetectService.start((data) => {
          this.sendToRenderer('monitor:status', data);
        });

        return { success: true, message: 'Đã bắt đầu theo dõi' };
      } catch (error) {
        console.error('Start monitor error:', error);
        this.sendToRenderer('monitor:status', {
          status: 'error',
          message: `Lỗi bắt đầu theo dõi: ${error.message}`,
        });
        return { success: false, error: error.message };
      }
    });

    // Dừng theo dõi
    ipcMain.handle('monitor:stop', async () => {
      try {
        if (this.autoDetectService) {
          await this.autoDetectService.cleanup();
        }

        this.sendToRenderer('monitor:status', {
          status: 'stopped',
          message: 'Đã dừng theo dõi',
        });

        return { success: true, message: 'Đã dừng theo dõi' };
      } catch (error) {
        console.error('Stop monitor error:', error);
        return { success: false, error: error.message };
      }
    });

    // Lấy danh sách sản phẩm
    ipcMain.handle('product:list', async () => {
      return {
        success: true,
        products: this.products,
        total: this.products.length,
      };
    });

    // Lấy trạng thái
    ipcMain.handle('status:get', async () => {
      return {
        success: true,
        status: {
          browserInitialized: !!this.browserManager,
          isLoggedIn: this.isLoggedIn,
          productsCount: this.products.length,
          isMonitoring: !!this.autoDetectService,
        },
      };
    });

    // Đóng trình duyệt
    ipcMain.handle('browser:close', async () => {
      try {
        if (this.autoDetectService) {
          await this.autoDetectService.cleanup();
        }

        if (this.browserManager) {
          await this.browserManager.close();
          this.browserManager = null;
        }

        this.autoDetectService = null;
        this.isLoggedIn = false;
        this.products = [];

        this.sendToRenderer('browser:status', {
          status: 'closed',
          message: 'Trình duyệt đã được đóng',
        });

        return { success: true, message: 'Trình duyệt đã được đóng' };
      } catch (error) {
        console.error('Close browser error:', error);
        return { success: false, error: error.message };
      }
    });
  }

  private sendToRenderer(channel: string, data: unknown): void {
    if (!this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  // Cleanup khi app đóng
  public async cleanup(): Promise<void> {
    try {
      if (this.autoDetectService) {
        await this.autoDetectService.cleanup();
      }
      if (this.browserManager) {
        await this.browserManager.close();
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}
