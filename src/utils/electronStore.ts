import Store from 'electron-store';

export const store = new Store() as any;

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

// User data
const setUserData = (user: UserData) => {
  store.set('user', user);
};

const getUserData = (): UserData | undefined => {
  return store.get('user') as UserData | undefined;
};

const updateUserData = (partial: Partial<UserData>) => {
  const current = getUserData() || {
    email: '',
    password: '',
    emailRecieveNoti: '',
  };
  setUserData({ ...current, ...partial });
};

// Product list
const setProducts = (products: ProductData[]) => {
  store.set('products', products);
};

const getProducts = (): ProductData[] => {
  return (store.get('products') as ProductData[]) || [];
};

const addProduct = (product: ProductData) => {
  const products = getProducts();
  setProducts([...products, product]);
};

const removeProduct = (linkProduct: string) => {
  const products = getProducts().filter((p) => p.linkProduct !== linkProduct);
  setProducts(products);
};

const updateProduct = (linkProduct: string, partial: Partial<ProductData>) => {
  const products = getProducts().map((p) =>
    p.linkProduct === linkProduct ? { ...p, ...partial } : p
  );
  setProducts(products);
};

const localStorage = {
  setUserData,
  getUserData,
  updateUserData,
  setProducts,
  getProducts,
  addProduct,
  removeProduct,
  updateProduct,
};
export default localStorage;
