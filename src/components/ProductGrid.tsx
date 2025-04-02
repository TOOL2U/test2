import React, { useMemo } from 'react';
import ProductCard from './ProductCard';
import StaggeredList from './StaggeredList';

interface Product {
  id: number;
  name: string;
  categories: string[];
  description: string;
  imageUrl: string;
  price: number;
  quantity: number;
}

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  loading?: boolean;
  error?: string | null;
  brandColor?: string;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onAddToCart,
  loading = false,
  error = null,
  brandColor = "#FFF02B"
}) => {
  // Memoize products to avoid unnecessary re-renders
  const memoizedProducts = useMemo(() => products, [products]);

  if (loading) {
    return (
      <div
        className="flex justify-center items-center h-64"
        role="status"
        aria-live="polite"
      >
        <div
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
          style={{ borderColor: brandColor }}
          aria-label="Loading"
        ></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-red-50 text-red-600 p-4 rounded-lg"
        role="alert"
        aria-live="assertive"
      >
        {error}
      </div>
    );
  }

  if (memoizedProducts.length === 0) {
    return (
      <div
        className="bg-white p-8 rounded-lg shadow-md text-center"
        role="region"
        aria-live="polite"
      >
        <h2 className="text-2xl font-semibold mb-4">No tools found</h2>
        <p className="text-gray-600 mb-6">
          We couldn't find any tools matching your criteria. Try adjusting your filters or search query.
        </p>
      </div>
    );
  }

  return (
    <StaggeredList
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      {memoizedProducts.map((product) => (
        <ProductCard
          key={product.id}
          id={product.id}
          name={product.name}
          categories={product.categories}
          description={product.description}
          imageUrl={product.imageUrl}
          price={product.price}
          quantity={product.quantity}
          onAddToCart={() => onAddToCart(product)}
          brandColor={brandColor}
        />
      ))}
    </StaggeredList>
  );
};

export default ProductGrid;
