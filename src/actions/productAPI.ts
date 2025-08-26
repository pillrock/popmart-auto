import axios, { AxiosError } from 'axios';
import delay from '../utils/delay';
import BrowserManager from '../browser';
import PaymentProcessor from './paymentProcessor';
import { LOCATOR } from '../constants/locator';
import { Page } from 'rebrowser-puppeteer-core';
import MailService from '../utils/sendmail';
import localStorage from '../utils/electronStore';
import EventEmitter = require('events');
interface StatusProduct {
  idProduct: string;
  isChecked: boolean;
  page: string;
  doneLoop: boolean;
  collectionId: number;
}

interface PageForApi {
  page: string;
  idProductsInPage: string[];
  collectionId: number;
}

interface CollectionData {
  collectionId: number;
  statusProducts: StatusProduct[];
  pageForAPI: PageForApi[];
}

interface SkusStock {
  onlineStock: number;
  onlineLockStock: number;
}
interface productStatusCheck {
  idProduct: string;
  status: string;
  remove?: boolean;
}

interface Skus {
  id: string;
  price: number;
  stock: SkusStock;
  discountPrice: number;
  currency: string;
}

interface ProductData {
  id: string;
  title: string;
  bannerImages: string[];
  skus: Skus[];
}

interface DataProductResponse {
  id: string;
  name: string;
  desc: string;
  productData: ProductData[];
  page: Page;
}

export class ProductAPI {
  private collections: Map<number, CollectionData>;
  private browserManager: BrowserManager;
  private emitter: EventEmitter;
  constructor(browserManager: BrowserManager) {
    this.collections = new Map();
    this.browserManager = browserManager;
    this.emitter = new EventEmitter();
  }
  async start(callback: (data: productStatusCheck) => void, waitTime: number) {
    this.emitter.on('newProductAdded', (collectionId: number) => {
      this.autoDetectForCollection(collectionId, callback, waitTime);
    });
    this.emitter.on('notFoundProductInCollection', (idProduct: string) => {
      callback({
        idProduct,
        status: `[❌] - không có sản phẩm trong dữ liệu`,
      });
    });
    // const promises = Array.from(this.collections.keys()).map((collectionId) =>
    //   this.autoDetectForCollection(collectionId)
    // );

    // await Promise.all(promises);
  }

  private getOrCreateCollection(collectionId: number): CollectionData {
    if (!this.collections.has(collectionId)) {
      this.collections.set(collectionId, {
        collectionId,
        statusProducts: [],
        pageForAPI: [],
      });
    }
    return this.collections.get(collectionId)!;
  }

  private async extractCollectionIdFromUrl(linkProduct: string): Promise<{
    collectionId: number;
    productData: {
      imgUrl: string;
      nameProduct: string;
      price: string;
      linkProduct: string;
    };
  } | null> {
    try {
      const page = await this.browserManager!.openPage(linkProduct);

      // Chờ element xuất hiện
      await page.waitForSelector('.ant-breadcrumb-link', { timeout: 10000 });

      const href = await page.evaluate(() => {
        const breadcrumbLinks = document.querySelectorAll(
          '.ant-breadcrumb-link a'
        );
        return breadcrumbLinks[1]?.getAttribute('href') || null;
      });

      /// lấy dữ liệu của sản phẩm
      const productData = await this.getProductData(page);
      console.log('Product Data:', productData);

      await page.close();

      if (href) {
        // Extract collection ID từ href (ví dụ: /category/123)
        const match = href.match(/\/category\/(\d+)/);
        if (match) {
          return {
            collectionId: parseInt(match[1]),
            productData: { ...productData, linkProduct },
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Lỗi khi lấy collection ID từ URL:', error);
      return null;
    }
  }
  getIdProduct = (url: string) => {
    const split = url.split('/');
    if (split.length == 7) {
      return split[split.length - 2];
    } else if (split.length == 6) {
      return split[split.length - 1];
    }
  };
  async removeProduct(linkProduct: string) {
    const idProduct = this.getIdProduct(linkProduct);
    if (!idProduct) {
      console.log('Không thấy ID sản phẩm', linkProduct);
      return;
    }

    // Tìm kiếm trong tất cả collections
    for (const [collectionId, collection] of this.collections.entries()) {
      const productIndex = collection.statusProducts.findIndex(
        (product) => product.idProduct === idProduct
      );

      if (productIndex !== -1) {
        // Xóa sản phẩm khỏi collection
        collection.statusProducts.splice(productIndex, 1);
        console.log(
          `Đã xóa sản phẩm ${idProduct} khỏi collection ${collectionId}`
        );
        return;
      }
    }

    console.log(
      `Không tìm thấy sản phẩm ${idProduct} trong bất kỳ collection nào`
    );
  }
  async addProduct(linkProduct: string) {
    /* TODO fix lỗi trong quá trình autoDetect khi thêm sản phẩm thì những dữ liệu 
    mới sẽ không gửi về được
    */
    const idProduct = this.getIdProduct(linkProduct);

    if (!idProduct) {
      console.log('Không thấy ID sản phẩm', linkProduct);
      return;
    }

    // Kiểm tra xem product đã tồn tại trong bất kỳ collection nào chưa
    for (const collection of this.collections.values()) {
      if (
        collection.statusProducts.some(
          (product) => product.idProduct === idProduct
        )
      ) {
        console.log('Trùng idProduct:', idProduct);
        return;
      }
    }

    // Lấy collection ID từ trang sản phẩm
    const { collectionId, productData } =
      await this.extractCollectionIdFromUrl(linkProduct);

    if (!collectionId) {
      console.log('Không thể lấy collection ID từ:', linkProduct);
      return;
    }

    // Lấy hoặc tạo collection data
    const isCollectionIdExist = this.collections.has(collectionId);
    const collectionData = this.getOrCreateCollection(collectionId);

    // Thêm product vào collection
    collectionData.statusProducts.push({
      idProduct: idProduct,
      isChecked: false,
      page: '',
      doneLoop: false,
      collectionId: collectionId,
    });

    console.log(
      `Đã thêm idProduct: ${idProduct} vào collection: ${collectionId}`
    );

    // this.filterProductByPage(collectionId);
    await this.checkPageForEachProduct();
    if (!isCollectionIdExist) {
      this.emitter.emit('newProductAdded', collectionId);
    }
    return productData;
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
  async checkPageForEachProduct() {
    // Chạy cho tất cả collections
    const promises = Array.from(this.collections.keys()).map((collectionId) =>
      this.checkPageForCollection(collectionId)
    );

    await Promise.all(promises);
  }

  private async checkPageForCollection(collectionId: number) {
    const collectionData = this.getOrCreateCollection(collectionId);
    let page = 1;
    let count = 0;
    let isRunning = true;
    let idProductsNotFound: string[] = [];
    while (
      isRunning &&
      collectionData.statusProducts.some(
        (products) => products.isChecked === false
      )
    ) {
      try {
        const popmartData: DataProductResponse | undefined = await this.callAPI(
          collectionId,
          page.toString()
        );

        if (!popmartData) {
          idProductsNotFound.map((idProduct) => {
            this.emitter.emit('notFoundProductInCollection', idProduct);
          });
          return;
        }

        const productsData = popmartData.productData;
        if (!productsData) {
          console.log('Bộ sưu tập ' + collectionId + ' không có sản phẩm');
          isRunning = false;
          return;
        }

        const productsId = productsData.map((product) => product.id);

        collectionData.statusProducts.forEach((product) => {
          const id = product.idProduct;
          if (!product.isChecked) {
            if (productsId.includes(id)) {
              product.isChecked = true;
              product.page = page.toString();
              console.log(
                `Trong ${collectionId}, trang ${page} có sản phẩm ${id}`
              );
              idProductsNotFound = idProductsNotFound.filter(
                (idNotFound) => idNotFound !== id
              );
            } else {
              product.isChecked = false;
              console.log(
                `Trong ${collectionId}, trang ${page} không có sản phẩm ${id}`
              );
              idProductsNotFound.push(id);
            }
          }
        });

        console.log(
          `----[${count}]: lần call API cho collection ${collectionId}`,
          collectionData.statusProducts
        );
        count++;
        page++;
        await delay(1000);
      } catch (error: unknown) {
        console.log(error);
        isRunning = false;
      }
    }

    collectionData.statusProducts.map((product) => {
      if (product.page === '') {
        console.log(
          'Sản phẩm ' +
            product.idProduct +
            ' không tìm thấy trong bộ sưu tập ' +
            collectionId
        );
      }
    });

    console.log(`Collection ${collectionId}:`, collectionData.statusProducts);
    this.filterProductByPage(collectionId);
  }

  private filterProductByPage(collectionId: number) {
    const collectionData = this.getOrCreateCollection(collectionId);

    collectionData.statusProducts.map((product) => {
      if (product.page === '' || product.isChecked === false) return;

      // check exist of page
      const index = collectionData.pageForAPI.findIndex(
        (pageCall) => pageCall.page === product.page
      );

      if (index != -1) {
        collectionData.pageForAPI[index]?.idProductsInPage.push(
          product.idProduct
        );
      } else {
        collectionData.pageForAPI.push({
          page: product.page,
          idProductsInPage: [product.idProduct],
          collectionId: collectionId,
        });
      }
    });

    console.log(`---collections: `, this.collections);
  }

  private checkOnlineStock(stock: SkusStock) {
    if (stock.onlineStock > 0) {
      return true;
    }
    return false;
  }

  private async callAPI(
    collectionId: number,
    keyPage: string
  ): Promise<DataProductResponse | undefined> {
    try {
      const res = await axios.get(
        `https://cdn-global.popmart.com/shop_productoncollection-${collectionId}-1-${keyPage}-jp-ja.json`
      );
      return res.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 404) {
          console.error(
            `Quá trang rồi, collection ${collectionId}, trang bị quá: ${keyPage}`
          );
        } else {
          console.error(error);
        }
      }
      return undefined;
    }
  }

  async openConfirmProductTabAndProcess({
    dataProduct,
    dataSkus,
    option,
    count = 2,
    callback,
  }: {
    dataProduct: ProductData;
    dataSkus: Skus;
    count?: number;
    option: 'box' | 'one';
    callback: (data: productStatusCheck) => void;
  }) {
    // spuId,
    // skuId,
    // count = 2,
    // spuTitle,
    console.log('Tien hanh thanh toan cho san pham: ', dataProduct.id);
    callback({
      idProduct: dataProduct.id,
      status: `[✅] - Tiến hành thanh toán cho sản phẩm`,
    });

    const url = `https://www.popmart.com/jp/order-confirmation?spuId=${dataProduct.id}&skuId=${dataSkus.id}&count=${count}&spuTitle=${encodeURIComponent(dataProduct.title)}`;
    const page = await this.browserManager!.openPage(url);
    const paymentProcessor = new PaymentProcessor(page);
    await paymentProcessor.confirmBeforePayment();
    console.log('thanh toan xong san pham: ', dataProduct.id);
    callback({
      idProduct: dataProduct.id,
      status: `[✅] - kiểm tra lỗi thanh toán...`,
    });
    console.log('kiem tra loi san pham: ', dataProduct.id);

    const hasPaymentError = await paymentProcessor.hasPaymentError(page);
    // await page.close();
    if (hasPaymentError) {
      console.log('phat hien loi san pham: ', dataProduct.id);
      callback({
        idProduct: dataProduct.id,
        status: `[✅] - Phát hiện lỗi thanh toán, xóa sản phẩm sau 5 giây...`,
      });
      return;
    } else {
      console.log('khong phat hien loi san pham: ', dataProduct.id);
    }
    callback({
      idProduct: dataProduct.id,
      status: `[✅] - Không phát hiện lỗi thanh toán, gửi mail thông báo...`,
    });
    console.log('hoan thanh kiem tra loi san pham: ', dataProduct.id);
    console.log('gui mail cho san pham: ', dataProduct.id);

    // send mail
    const mailService = new MailService(
      localStorage.getUserData().emailRecieveNoti
    );
    // const { page, linkProduct, ...dataReq } = dataProduct;
    const isSent = await mailService.sendMail({
      emailAccount: localStorage.getUserData().email,
      nameProduct: dataProduct.title,
      price: dataSkus.price.toString(),
      imgUrl: dataProduct.bannerImages[0],
      resultOrder: { option: option, quantity: count },
    });
    if (isSent) {
      console.log(
        `Đã gửi email thông báo cho sản phẩm ${dataProduct.title} với giá ${dataSkus.price}`
      );
      callback({
        idProduct: dataProduct.id,
        status: `[✅] - Đã gửi mail thành công, xóa sản phẩm sau 5 giây...`,
      });
    }
    setTimeout(async () => {
      await page.close();
    }, 5000);
  }

  private async autoDetectForCollection(
    collectionId: number,
    callback: (data: productStatusCheck) => void,
    waitTime: number
  ) {
    const collectionData = this.getOrCreateCollection(collectionId);
    let count = 1;
    let isRunning = true;

    while (isRunning && this.collections.has(collectionId)) {
      const keyPages = collectionData.pageForAPI.map(
        (pageCall) => pageCall.page
      );

      if (keyPages.length === 0) {
        console.log(`Bộ sưu tập ${collectionId} không có sản phẩm`);
        this.collections.delete(collectionId);
        isRunning = false;
        return;
      }

      console.log(
        `[${count}] -- auto get data for collectionId ${collectionId}`
      );

      const promises = keyPages.map(async (keyPage) => {
        try {
          const popmartData = await this.callAPI(collectionId, keyPage);
          if (!popmartData) return;

          const productsData = popmartData.productData;

          const objectPageForAPI_CommonPage = collectionData.pageForAPI.filter(
            (pageCall) => pageCall.page === keyPage
          );

          const productDataForListId = productsData.filter((product) => {
            if (
              collectionData.statusProducts.find(
                (product_) => product_.idProduct === product.id
              )?.doneLoop
            ) {
              return false;
            }

            return objectPageForAPI_CommonPage.some((pageCall) =>
              pageCall.idProductsInPage.includes(product.id)
            );
          });

          productDataForListId.map(async (product) => {
            const skusProducts = product.skus;

            if (skusProducts.length >= 2) {
              console.log(`Sản phẩm ${product.id} có 2 biến thể trở lên`);
              callback({
                idProduct: product.id,
                status: `[${count}] - Sản phẩm có 2 biến thể trở lên`,
              });
              const skus2 = skusProducts[1];
              if (skus2?.stock && this.checkOnlineStock(skus2?.stock)) {
                console.log(
                  `--- sản phẩm ${product.id} còn hàng ở biến thể thứ 2`
                );
                callback({
                  idProduct: product.id,
                  status: `[${count}] - sản phẩm còn hàng ở biến thể thứ 2`,
                });
                collectionData.statusProducts.map((product_) => {
                  if (product_.idProduct === product.id)
                    product_.doneLoop = true;
                });
                await this.openConfirmProductTabAndProcess({
                  dataProduct: product,
                  dataSkus: skus2,
                  option: 'box',
                  callback,
                });
              } else {
                console.log(
                  `--- sản phẩm ${product.id} đã hết hàng biến thể thứ 2`
                );
                callback({
                  idProduct: product.id,
                  status: `[${count}] - sản phẩm đã hết hàng biến thể thứ 2`,
                });
                const skus1 = skusProducts[0];
                if (skus1?.stock && this.checkOnlineStock(skus1?.stock)) {
                  console.log(
                    `--- sản phẩm ${product.id} còn hàng biến thể thứ 1`
                  );
                  callback({
                    idProduct: product.id,
                    status: `[${count}] - sản phẩm còn hàng ở biến thể thứ 1`,
                  });
                  collectionData.statusProducts.map((product_) => {
                    if (product_.idProduct === product.id)
                      product_.doneLoop = true;
                  });
                  await this.openConfirmProductTabAndProcess({
                    dataProduct: product,
                    dataSkus: skus1,
                    option: 'one',
                    callback,
                  });
                }
              }
            } else {
              console.log(`Sản phẩm ${product.id} có 1 biến thể`);
              callback({
                idProduct: product.id,
                status: `[${count}] - sản phẩm có 1 biến thể`,
              });
              const skus1 = skusProducts[0];
              if (skus1?.stock && this.checkOnlineStock(skus1?.stock)) {
                console.log(
                  `--- sản phẩm ${product.id} còn hàng ở biến thể duy nhất`
                );
                callback({
                  idProduct: product.id,
                  status: `[${count}] - sản phẩm còn hàng ở biến thể duy nhất`,
                });
                collectionData.statusProducts.map((product_) => {
                  if (product_.idProduct === product.id)
                    product_.doneLoop = true;
                });

                await this.openConfirmProductTabAndProcess({
                  dataProduct: product,
                  dataSkus: skus1,
                  option: 'one',
                  callback,
                });
              }
            }
          });
        } catch (error) {
          console.log(`Lỗi trong collection ${collectionId}:`, error);
        }
      });

      await Promise.all(promises);
      count++;
      await delay(waitTime);

      // Kiểm tra xem tất cả products đã doneLoop chưa
      const allDone = collectionData.statusProducts.every(
        (product) => product.doneLoop
      );
      if (allDone) {
        console.log(`Collection ${collectionId} đã hoàn thành`);
        this.collections.delete(collectionId);
        isRunning = false;
      }
    }
  }

  // Utility methods để lấy thông tin
  getAllCollections(): number[] {
    return Array.from(this.collections.keys());
  }
  async cleanup() {
    this.collections.clear();
  }

  getCollectionData(collectionId: number): CollectionData | undefined {
    return this.collections.get(collectionId);
  }

  getAllProductsStatus(): StatusProduct[] {
    const allProducts: StatusProduct[] = [];
    this.collections.forEach((collection) => {
      allProducts.push(...collection.statusProducts);
    });
    return allProducts;
  }
}
