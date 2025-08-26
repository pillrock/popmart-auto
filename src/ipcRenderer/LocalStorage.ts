// renderer-api.ts - Sử dụng trong renderer process

import { Setting } from '../components/PopmartAutoContainer';
import { ProductData, UserData } from '../ipcMain/LocalStorage';
import { APIResponse } from './BrowserControl';

export class RendererAPI_LocalStorage {
  static setUserData(userData: UserData): Promise<APIResponse> {
    return window.electronAPI.ipcRenderer.invoke(
      'storage:setUserData',
      userData
    );
  }
  static getUserData(): Promise<APIResponse<UserData | undefined>> {
    return window.electronAPI.ipcRenderer.invoke('storage:getUserData');
  }

  static updateUserData(partialData: Partial<UserData>): Promise<APIResponse> {
    return window.electronAPI.ipcRenderer.invoke(
      'storage:updateUserData',
      partialData
    );
  }

  // Product Methods
  static setProducts(products: ProductData[]): Promise<APIResponse> {
    return window.electronAPI.ipcRenderer.invoke(
      'storage:setProducts',
      products
    );
  }
  static setSettings(settings: Setting): Promise<APIResponse> {
    return window.electronAPI.ipcRenderer.invoke(
      'storage:setSettings',
      settings
    );
  }

  static getProducts(): Promise<APIResponse<ProductData[]>> {
    return window.electronAPI.ipcRenderer.invoke('storage:getProducts');
  }
  static getSettings(): Promise<APIResponse<Setting | null>> {
    return window.electronAPI.ipcRenderer.invoke('storage:getSettings');
  }

  static addProduct(product: ProductData): Promise<APIResponse> {
    return window.electronAPI.ipcRenderer.invoke('storage:addProduct', product);
  }

  static removeProduct(linkProduct: string): Promise<APIResponse> {
    return window.electronAPI.ipcRenderer.invoke(
      'storage:removeProduct',
      linkProduct
    );
  }

  static updateProduct(
    linkProduct: string,
    partial: Partial<ProductData>
  ): Promise<APIResponse> {
    return window.electronAPI.ipcRenderer.invoke(
      'storage:updateProduct',
      linkProduct,
      partial
    );
  }
}
