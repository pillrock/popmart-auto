// handle logic

import { useEffect, useState } from 'react';
import PopmartAuto from './PopmartAuto';
import { PopMartAutoContext } from '../contexts/PopmartAuto';
import { RendererAPI_BrowserControl } from '../ipcRenderer/BrowserControl';
import { useNotification } from '../hooks/useNotification';
import { RendererAPI_LocalStorage } from '../ipcRenderer/LocalStorage';
import delay from '../utils/delay';
export type Account = {
  email: string;
  password: string;
  emailRecieveNoti: string;
};

export type ProductLess = {
  linkProduct: string;
  isAddMore?: boolean;
};

const nullProductLess = {
  linkProduct: '',
  isAddMore: false,
};
const nullAccount = {
  email: '',
  password: '',
  emailRecieveNoti: '',
};
export interface ProductFull extends ProductLess {
  nameProduct?: string;
  price?: string;
  imgUrl?: string;
}
export interface statusProduct {
  linkProduct: string;
  status: string;
}

export default function PopmartAutoContainer() {
  const [accountInput, setAccountInput] = useState<Account | null>(nullAccount);
  const [productInput, setProductInput] = useState<ProductLess | null>(
    nullProductLess
  );
  const [isBrowserRuning, setIsBrowserRuning] = useState<boolean>(false);
  const [products, setProducts] = useState<ProductFull[]>([]);
  const [statusProducts, setStatusProducts] = useState<Record<string, string>>(
    {}
  );
  const [isManualLogin, setIsManualLogin] = useState<boolean>(false);
  const { showNotification, NotificationComponents } = useNotification();

  /**
   * - lấy dữ liệu từ electron-store (nếu có)
   * - đăng ký nhận data từ callback, check status Product
   */
  useEffect(() => {
    // lấy dữ liệu tron electron
    (async () => {
      const res1 = await RendererAPI_LocalStorage.getUserData();
      const res2 = await RendererAPI_LocalStorage.getProducts();
      console.log(res1, res2);

      res1.data && setAccountInput(res1.data);
      res2.data.length > 0 && setProducts(res2.data);
    })();

    // nhận statusProduct khi autoDetect
    RendererAPI_BrowserControl.onMonitorStatus((data) => {
      console.log(data);

      setStatusProducts((prev) => ({
        ...prev,
        [data.idProduct]: data.status,
      }));
    });
  }, []);

  const onRunBrowser = async () => {
    /**
     * kiểm tra các trường trước khi chạy browser
     * đảm bảo khi browser bật lên đăng nhập luôn
     */
    if (
      !(
        accountInput.email &&
        accountInput.emailRecieveNoti &&
        accountInput.password
      )
    ) {
      showNotification(
        'Vui lòng nhập email, mật khẩu và email nhận thông báo',
        'warning'
      );
      return;
    }

    /// mở chrome
    showNotification('Tiến hành mở Chrome', 'info');
    await RendererAPI_BrowserControl.initBrowser();

    setIsBrowserRuning(true);

    /// đăng nhập
    const res = await RendererAPI_BrowserControl.login({
      email: accountInput.email,
      password: accountInput.password,
      isManual: isManualLogin,
    });

    if (res.success) {
      showNotification(res.message, 'success');

      /**
       * nếu đăng nhập thành công sẽ lưu dữ liệu sử dụng
       * electrong-store
       * từ sau lấy ra luôn, người dùng đỡ phải nhập
       */
      RendererAPI_LocalStorage.setUserData(accountInput);
      if (isManualLogin) {
        await delay(45000);
      }
    } else {
      showNotification(res.message, 'error');
    }

    /// nếu thấy có hàng thì mở hàng hàng loạt, đồng thời cập nhật thông tin sản phẩm

    // start auto detact restock◘
    await RendererAPI_BrowserControl.startMonitorAPI();
    // console.log(monitorres);
    if (products.length > 0) {
      showNotification('Tiến hành mở và lấy dữ liệu sản phẩm.', 'success');
      const res = await RendererAPI_BrowserControl.addProducts(products);
      if (res.success) {
        showNotification(res.message, 'success');

        /**
         * lưu trữ sản phẩm khi lấy dữ liệu sản phẩm ở browser
         * thành công
         */
        RendererAPI_LocalStorage.setProducts(res.data);

        /**
         * khi có dữ liệu về ảnh, tên, giá tiền của sản
         * phẩm thì cập nhật lại dữ liệu hiển thị lên
         * frontend
         */
        res.data.forEach((dataProduct) =>
          setProducts((prev) =>
            prev.map((product) =>
              product.linkProduct == dataProduct.linkProduct
                ? { ...product, ...dataProduct }
                : product
            )
          )
        );
      } else {
        showNotification(res.message, 'error');
      }

      showNotification('Mở và lấy dữ liệu sản phẩm thành công', 'success');
    }
  };
  const onCloseBrowser = async () => {
    await RendererAPI_BrowserControl.closeBrowser();
    setIsBrowserRuning(false);

    setStatusProducts({});
  };

  /**
   * - hàm xử lý thêm sản phẩm (có thể thêm 1 hoặc nhiều sản phẩm)
   * - thêm ở phía phầm mềm đồng thời có logic thêm ở phía browser
   * - đặt lại value của productInput về
   */
  const onAddProduct = async () => {
    /*
    kiểm tra trước xem link sản phẩm đã tồn tại hay chưa,
    tránh trường hợp trùng link, dẫn đến browser trả về dữ liệu dup,
    ngoài ra thêm 2 sản phẩm để săn cho 1 tài khoản cũng không có ý nghĩa,
    nên chấm dứt ngay từ đầu ;>>
    */
    if (
      products &&
      products.some(
        (product) => product.linkProduct === productInput.linkProduct
      )
    ) {
      showNotification('Sản phẩm này đã tồn tại rồi', 'warning');
      return;
    }
    if (productInput.isAddMore) {
      const linkProducts = productInput.linkProduct.split('\n');
      linkProducts.map((link) => {
        if (
          !productInput.linkProduct.startsWith(
            'https://www.popmart.com/jp/products/'
          )
        ) {
          showNotification(
            'Phát hiện link sản phẩm không hợp lệ, Link sản phẩm phải có dạng: https://www.popmart.com/jp/products/...'
          );
          return;
        }
        setProducts((prev) => [...prev, { linkProduct: link }]);
      });
    } else {
      // kiểm tra dữ liệu đầu vào khi thêm 1
      if (
        !productInput.linkProduct.startsWith(
          'https://www.popmart.com/jp/products/'
        )
      ) {
        showNotification(
          'Phát hiện link sản phẩm không hợp lệ, Link sản phẩm phải có dạng: https://www.popmart.com/jp/products/...'
        );
        return;
      }

      setProducts((prev) => [
        ...prev,
        {
          linkProduct: productInput.linkProduct,
        },
      ]);
    }

    // nếu trình duyệt bật thì addProduct như bình thường (1 sản phẩm 1)
    if (isBrowserRuning) {
      const res = await RendererAPI_BrowserControl.addProduct(
        productInput as ProductFull
      );
      if (res.success) {
        showNotification(res.message, 'success');

        /**
         * lưu trữ dữ liệu sản phẩm
         */
        if (!res.data) {
          showNotification('Thêm sản phẩm thất bại', 'error');
          return;
        }
        RendererAPI_LocalStorage.addProduct(res.data);

        /**
         * khi có dữ liệu về ảnh, tên, giá tiền của sản
         * phẩm thì cập nhật lại dữ liệu hiển thị lên
         * frontend
         */
        setProducts((prev) =>
          prev.map((product) =>
            product.linkProduct == res.data.linkProduct
              ? { ...product, ...res.data }
              : product
          )
        );
      } else {
        showNotification(res.message, 'error');
      }
    }
    // xóa value ở input
    setProductInput(nullProductLess);
  };

  const onRemoveProduct = async (linkProduct: string) => {
    // xóa ở frontend
    setProducts((prev) =>
      prev.filter((product) => product.linkProduct != linkProduct)
    );

    // xóa ở browser
    const res = await RendererAPI_BrowserControl.removeProduct(linkProduct);
    if (res.success) {
      showNotification(res.message, 'success');

      RendererAPI_LocalStorage.removeProduct(linkProduct);
    } else {
      showNotification(res.message, 'error');
    }
  };
  const popmartAutoProps = {
    isBrowserRuning,
  };

  return (
    <PopMartAutoContext.Provider
      value={{
        isBrowserRuning,
        setIsBrowserRuning,
        accountInput,
        setAccountInput,
        productInput,
        setProductInput,
        products,
        setProducts,
        onAddProduct,
        onRunBrowser,
        onCloseBrowser,
        onRemoveProduct,
        statusProducts,
        isManualLogin,
        setIsManualLogin,
      }}
    >
      <PopmartAuto {...popmartAutoProps} />
      {NotificationComponents}
    </PopMartAutoContext.Provider>
  );
}
