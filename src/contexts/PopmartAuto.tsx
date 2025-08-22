import { createContext, useContext } from 'react';
import {
  Account,
  ProductFull,
  ProductLess,
  statusProduct,
} from '../components/PopmartAutoContainer';

type popmartAutoType = {
  isBrowserRuning: boolean;
  setIsBrowserRuning: (bl: boolean) => void;
  accountInput: Account;
  setAccountInput: (value: Account | ((prev: Account) => Account)) => void;
  productInput: ProductLess;
  setProductInput: (
    value: ProductLess | ((prev: ProductLess) => ProductLess)
  ) => void;

  products: ProductFull[];
  setProducts: (
    value: ProductFull[] | ((prev: ProductFull[]) => ProductFull[])
  ) => void;
  onRunBrowser: () => Promise<void>;
  onCloseBrowser: () => Promise<void>;
  onAddProduct: () => Promise<void>;
  onRemoveProduct: (linkProduct: string) => Promise<void>;
  statusProducts: Record<string, string>;
  isManualLogin: boolean;
  setIsManualLogin: (bl: boolean) => void;
};
export const PopMartAutoContext = createContext<popmartAutoType | null>(null);

export const usePopMartAuto = () => {
  const context = useContext(PopMartAutoContext);
  if (!context) {
    throw new Error('useProduct must be used within ProductProvider');
  }
  return context;
};
