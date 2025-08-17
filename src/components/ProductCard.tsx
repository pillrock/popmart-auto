import { CopyIcon, ImageIcon, Link, Loader2Icon, XIcon } from 'lucide-react';
import { ProductFull } from './PopmartAutoContainer';
import { useEffect, useState } from 'react';
import { usePopMartAuto } from '../contexts/PopmartAuto';

export default function ProductCard({
  linkProduct,
  imgUrl,
  nameProduct,
  price,
}: ProductFull) {
  const [copied, setCopied] = useState(false);
  const { onRemoveProduct, statusProducts, setProducts, products } =
    usePopMartAuto();
  const [removeOneTimes, setRemoveOneTimes] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(linkProduct);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  console.log('status product: ', statusProducts);
  const getIdProduct = (url: string) => {
    const split = url.split('/');
    if (split.length == 7) {
      return split[split.length - 2];
    } else if (split.length == 6) {
      return split[split.length - 1];
    }
  };
  useEffect(() => {
    if (
      statusProducts[getIdProduct(linkProduct)]?.includes(
        'xóa sản phẩm sau 5 giây'
      ) &&
      !removeOneTimes
    ) {
      console.log('REMOVEEEEEEEEEEEEEEEEEe: ', products);
      setRemoveOneTimes(true);
      setTimeout(() => {
        // xóa ở frontend
        console.log('ĐÃ XÓA: ', products);
        onRemoveProduct(linkProduct);
      }, 5000);
    }
  }, [statusProducts]);
  return (
    <div className="group relative flex max-w-[200px] flex-col gap-y-2 text-wrap">
      <span
        onClick={() => onRemoveProduct(linkProduct)}
        className="bt pointer-events-none absolute right-0 z-10 !bg-red-500 p-2 text-white opacity-0 transition-all group-hover:pointer-events-auto group-hover:opacity-100"
      >
        <XIcon size={20} />
      </span>
      <span
        onClick={handleCopy}
        className="bt pointer-events-none absolute left-0 z-10 flex gap-x-1 !bg-gray-800 p-1 text-white opacity-0 transition-all group-hover:pointer-events-auto group-hover:opacity-100"
      >
        <CopyIcon size={15} />
        <p className="text-[10px]">{copied ? 'Đã copy' : 'Link'}</p>
      </span>
      <div className="aspect-square h-[200px] w-[200px] overflow-hidden">
        {imgUrl ? (
          <img
            className="transition-all group-hover:scale-[1.08]"
            src={imgUrl}
            alt="img"
          />
        ) : (
          <div className="grid h-full w-full animate-pulse place-items-center bg-gray-200 text-white">
            <ImageIcon />
          </div>
        )}
      </div>
      {nameProduct ? (
        <h1 className="text-xs">{nameProduct}</h1>
      ) : (
        <div className="h-[30px] w-full animate-pulse bg-gray-200"></div>
      )}
      {price ? (
        <p className="font-bold text-[#06b6d4]">{price}</p>
      ) : (
        <div className="h-[20px] w-[50%] animate-pulse bg-gray-200"></div>
      )}

      <span className="flex w-full items-center gap-x-1 bg-gray-500 p-1 text-xs text-white">
        <Loader2Icon size={15} className="animate-spin" />
        <p>{statusProducts[getIdProduct(linkProduct)] || 'Chờ khởi động...'}</p>
      </span>
    </div>
  );
}
