import React from 'react';
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
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onAddToCart,
  loading = false,
  error = null,
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFD700]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-semibold mb-4">No tools found</h2>
        <p className="text-gray-600 mb-6">
          We couldn't find any tools matching your criteria. Try adjusting your filters or search query.
        </p>
      </div>
    );
  }

  return (
    <StaggeredList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
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
        />
      ))}
    </StaggeredList>
  );
};

export default ProductGrid;
