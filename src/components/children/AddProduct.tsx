import { FormEvent } from 'react';
import { usePopMartAuto } from '../../contexts/PopmartAuto';
import { LinkIcon, PlusIcon } from 'lucide-react';
export default function AddProduct() {
  const { productInput, setProductInput, onAddProduct, isBrowserRuning } =
    usePopMartAuto();

  return (
    <div className="max-h-min min-w-[243px] space-y-2 p-2 shadow-xl transition-all">
      <div className="flex flex-col gap-y-2">
        <h1 className="text-base">THÊM SẢN PHẨM</h1>
        <div
          onClick={() => {
            /*
              chỉ thêm được nhiều khi trình duyệt chưa bật
              nhằm đảm bảo logic của trình duyệt
              mới bật lên sẽ quét nhiều sản phẩm
              khi bật rồi sẽ bật 1 sản phẩm
            */
            if (isBrowserRuning) return;

            setProductInput((prev) => ({
              ...prev,
              isAddMore: !productInput.isAddMore,
            }));
          }}
          className="flex cursor-pointer items-center justify-between border border-gray-300 p-2"
        >
          <p>Thêm nhiều</p>
          <div
            className={`relative transition-all duration-300 ${productInput.isAddMore && 'bg-blue-400'} aspect-square h-[20px] w-[40px] rounded-full border-2 border-blue-400`}
          >
            <div
              className={`transition-all duration-300 ${productInput.isAddMore ? 'translate-x-[21px] bg-white' : 'translate-x-[1px]'} absolute aspect-square h-[15px] w-[15px] translate-y-[.5px] rounded-full bg-blue-400`}
            ></div>
          </div>
        </div>
      </div>
      <form
        action=""
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          onAddProduct();
        }}
        className="flex flex-col gap-y-2"
      >
        <div className="group flex items-center border border-gray-300 bg-white p-2 transition-all focus-within:border-blue-400">
          <LinkIcon
            size={20}
            className="mr-2 self-start text-gray-500 transition-all group-focus-within:text-blue-400"
          />
          {productInput.isAddMore ? (
            <textarea
              required
              placeholder="Mỗi Link 1 dòng (nhấn Enter xuống dòng)"
              onInvalid={(e) =>
                (e.target as HTMLInputElement).setCustomValidity(
                  'Vui lòng điền link sản phẩm'
                )
              }
              onInput={(e) =>
                (e.target as HTMLInputElement).setCustomValidity('')
              }
              value={productInput.linkProduct}
              onChange={(e) =>
                setProductInput((prev) => ({
                  ...prev,
                  linkProduct: e.target.value,
                }))
              }
              className="w-full outline-none"
            />
          ) : (
            <input
              type="text"
              required
              placeholder="Link sản phẩm"
              onInvalid={(e) =>
                (e.target as HTMLInputElement).setCustomValidity(
                  'Vui lòng điền link sản phẩm'
                )
              }
              onInput={(e) =>
                (e.target as HTMLInputElement).setCustomValidity('')
              }
              value={productInput.linkProduct}
              onChange={(e) =>
                setProductInput((prev) => ({
                  ...prev,
                  linkProduct: e.target.value,
                }))
              }
              className="w-full outline-none"
            />
          )}
        </div>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-x-2 bg-blue-400 px-3 py-1 text-white hover:bg-blue-500"
        >
          <span>
            <PlusIcon size={19} />
          </span>
          Thêm sản phẩm
        </button>
      </form>
    </div>
  );
}
