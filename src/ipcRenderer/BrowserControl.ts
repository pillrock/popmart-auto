import { ProductFull } from '../components/PopmartAutoContainer';

export interface ProductInfo {
  url: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface APIResponse<T = any> {
  status?: boolean;
  success?: boolean;
  message?: string;
  error?: string;
  data?: T;
}
interface DataProduct {
  linkProduct: string;
  imgSrc: string;
  name: string;
  price: string;
}

export interface StatusData {
  status:
    | 'initialized'
    | 'processing'
    | 'success'
    | 'error'
    | 'closed'
    | 'started'
    | 'stopped'
    | 'added'
    | 'removed';
  message: string;
  product?: ProductInfo;
  totalProducts?: number;
}

export interface AppStatus {
  browserInitialized: boolean;
  isLoggedIn: boolean;
  productsCount: number;
  isMonitoring: boolean;
}

export class RendererAPI_BrowserControl {
  // Browser controls
  static async initBrowser(): Promise<APIResponse> {
    return window.electronAPI.ipcRenderer.invoke('browser:init');
  }

  static async closeBrowser(): Promise<APIResponse> {
    return window.electronAPI.ipcRenderer.invoke('browser:close');
  }

  // Login
  static async login(credentials: LoginCredentials): Promise<APIResponse> {
    return window.electronAPI.ipcRenderer.invoke('browser:login', credentials);
  }

  // Product management
  static async addProduct(
    product: ProductFull
  ): Promise<APIResponse<DataProduct>> {
    return window.electronAPI.ipcRenderer.invoke('product-api:add', product);
  }
  static async addProducts(
    products: ProductFull[]
  ): Promise<APIResponse<DataProduct[]>> {
    return window.electronAPI.ipcRenderer.invoke(
      'product-api:add-more',
      products
    );
  }

  static async removeProduct(linkProduct: string): Promise<APIResponse> {
    return window.electronAPI.ipcRenderer.invoke('product:remove', linkProduct);
  }

  static async getProducts(): Promise<
    APIResponse<{ products: ProductFull[]; total: number }>
  > {
    return window.electronAPI.ipcRenderer.invoke('product:list');
  }

  // Monitor controls
  static async startMonitor(): Promise<APIResponse> {
    return window.electronAPI.ipcRenderer.invoke('monitor:start');
  }
  static async startMonitorAPI(): Promise<APIResponse> {
    return window.electronAPI.ipcRenderer.invoke('monitor-api:start');
  }
  static async startAPIProduct(data: {
    products: string[];
    collectionId: string;
  }): Promise<APIResponse> {
    return window.electronAPI.ipcRenderer.invoke('productAPI:start', data);
  }
  static async stopMonitor(): Promise<APIResponse> {
    return window.electronAPI.ipcRenderer.invoke('monitor:stop');
  }

  // Status
  static async getStatus(): Promise<APIResponse<{ status: AppStatus }>> {
    return window.electronAPI.ipcRenderer.invoke('status:get');
  }

  // Event listeners
  static onBrowserStatus(callback: (data: StatusData) => void): () => void {
    window.electronAPI.ipcRenderer.on('browser:status', callback);
    return () =>
      window.electronAPI.ipcRenderer.removeListener('browser:status', callback);
  }

  static onLoginStatus(callback: (data: StatusData) => void): () => void {
    window.electronAPI.ipcRenderer.on('login:status', callback);
    return () =>
      window.electronAPI.ipcRenderer.removeListener('login:status', callback);
  }

  static onProductStatus(callback: (data: StatusData) => void): () => void {
    window.electronAPI.ipcRenderer.on('product:status', callback);
    return () =>
      window.electronAPI.ipcRenderer.removeListener('product:status', callback);
  }

  static onMonitorStatus(
    callback: (data: { idProduct: string; status: string }) => void
  ): () => void {
    window.electronAPI.ipcRenderer.on('monitor:status', callback);
    return () =>
      window.electronAPI.ipcRenderer.removeListener('monitor:status', callback);
  }
}
