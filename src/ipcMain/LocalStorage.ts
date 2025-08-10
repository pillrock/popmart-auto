import { ipcMain } from 'electron';

export interface UserData {
  email: string;
  password: string;
  emailRecieveNoti: string;
}

export interface ProductData {
  linkProduct: string;
  nameProduct?: string;
  price?: string;
  imgUrl?: string;
}

export default class LocaStorage {
  private store: any;
  constructor(store: any) {
    this.store = store;
    this.setUpIpcHandlers();
  }

  private setUpIpcHandlers(): void {
    // User Data Handlers
    ipcMain.handle('storage:setUserData', (_, user: UserData) =>
      this.setUserData(user)
    );
    ipcMain.handle('storage:getUserData', () => {
      return { data: this.getUserData() };
    });
    ipcMain.handle('storage:updateUserData', (_, partial: Partial<UserData>) =>
      this.updateUserData(partial)
    );

    // Product Handlers
    ipcMain.handle('storage:setProducts', (_, products: ProductData[]) =>
      this.setProducts(products)
    );
    ipcMain.handle('storage:getProducts', () => {
      return { data: this.getProducts() };
    });
    ipcMain.handle('storage:addProduct', (_, product: ProductData) =>
      this.addProduct(product)
    );
    ipcMain.handle('storage:removeProduct', (_, linkProduct: string) =>
      this.removeProduct(linkProduct)
    );
    ipcMain.handle(
      'storage:updateProduct',
      (_, linkProduct: string, partial: Partial<ProductData>) =>
        this.updateProduct(linkProduct, partial)
    );
  }
  setUserData = (user: UserData) => {
    this.store.set('user', user);
  };

  getUserData = (): UserData | undefined => {
    return this.store.get('user') as UserData | undefined;
  };

  updateUserData = (partial: Partial<UserData>) => {
    const current = this.getUserData() || {
      email: '',
      password: '',
      emailRecieveNoti: '',
    };
    this.setUserData({ ...current, ...partial });
  };

  // Product list
  setProducts = (products: ProductData[]) => {
    this.store.set('products', products);
  };

  getProducts = (): ProductData[] => {
    return (this.store.get('products') as ProductData[]) || [];
  };

  addProduct = (product: ProductData) => {
    const products = this.getProducts();
    this.setProducts([...products, product]);
  };

  removeProduct = (linkProduct: string) => {
    const products = this.getProducts().filter(
      (p) => p.linkProduct !== linkProduct
    );
    this.setProducts(products);
  };

  updateProduct = (linkProduct: string, partial: Partial<ProductData>) => {
    const products = this.getProducts().map((p) =>
      p.linkProduct === linkProduct ? { ...p, ...partial } : p
    );
    this.setProducts(products);
  };
}
