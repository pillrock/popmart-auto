import { Play, Square } from 'lucide-react';
import AccountSet from './children/AccountSet';
import ProductRender from './ProductsRender';
import AddProduct from './children/AddProduct';
import { usePopMartAuto } from '../contexts/PopmartAuto';
import { useNotification } from '../hooks/useNotification';
import { RendererAPI_BrowserControl } from '../ipcRenderer/BrowserControl';

export default function PopmartAuto({
  isBrowserRuning,
}: {
  isBrowserRuning: boolean;
}) {
  const { onRunBrowser, onCloseBrowser, setIsBrowserRuning } = usePopMartAuto();
  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      {/* Nội dung chính */}
      <div className="mt-12 flex justify-between gap-x-5 p-2">
        <div className="flex gap-x-2">
          {/* tài khoản */}
          <AccountSet />
          {/* Thêm sản phẩm */}
          <AddProduct />
        </div>
        <div>
          {/* Nút bắt đầu chạy */}
          <button className="bt cursor-pointer text-white hover:opacity-80">
            {!isBrowserRuning ? (
              <span
                onClick={async () => {
                  await onRunBrowser();
                }}
                // onClick={async () => {
                //   const result =
                //     await RendererAPI_BrowserControl.startAPIProduct({
                //       collectionId: '247',
                //       products: [
                //         'https://www.popmart.com/jp/products/4265/PINO-JELLY-Chocolate-Cookie-Figurine',
                //         'https://www.popmart.com/jp/products/5312/THE-MONSTERS-I-FOUND-YOU-%E3%81%AC%E3%81%84%E3%81%90%E3%82%8B%E3%81%BF',
                //       ],
                //     });
                //   console.log(result);
                // }}
                className="flex w-full items-center justify-center bg-green-500 p-2"
              >
                <Play size={20} className="mr-2" />
                <p>Bắt đầu chạy</p>
              </span>
            ) : (
              <span
                onClick={async () => {
                  await onCloseBrowser();
                }}
                className="flex w-full items-center justify-center bg-red-500 p-2"
              >
                <Square size={20} className="mr-2" />
                <p>Ngừng chạy</p>
              </span>
            )}
          </button>
        </div>
      </div>
      <ProductRender />
    </div>
  );
}
