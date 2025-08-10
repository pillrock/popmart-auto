import { usePopMartAuto } from '../contexts/PopmartAuto';
import ProductCard from './ProductCard';

export default function ProductRender() {
  const { products } = usePopMartAuto();
  return (
    <div className="w-screen overflow-hidden overflow-x-scroll p-6">
      <div className="flex gap-x-4">
        {products && products.length > 0 ? (
          products.map((product) => (
            <div key={product.linkProduct}>
              <ProductCard {...product} />
            </div>
          ))
        ) : (
          <div></div>
        )}
      </div>
    </div>
  );
}
