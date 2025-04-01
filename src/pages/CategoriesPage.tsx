import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Search, ChevronDown, ChevronUp, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Button from '../components/Button';
import CategoryFilter from '../components/CategoryFilter';
import ProductGrid from '../components/ProductGrid';
import { useProducts, Product } from '../utils/productService';

const CategoriesPage: React.FC = () => {
  const { products, loading, error } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortOption, setSortOption] = useState<'price-asc' | 'price-desc' | 'name-asc' | 'name-desc'>('name-asc');

  const { addToCart, totalItems } = useCart();
  const navigate = useNavigate();

  const categories = Array.from(
    new Set(
      products.flatMap(product => product.categories)
    )
  ).sort();

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory ? 
      product.categories.some(cat => cat.toLowerCase() === selectedCategory.toLowerCase()) : 
      true;

    const matchesSearch = searchQuery ? 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) : 
      true;

    return matchesCategory && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortOption) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      brand: product.categories[0] || 'Tool2U',
      image: product.imageUrl,
      price: product.price
    });
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category === selectedCategory ? null : category);
  };

  return (
    <div className="pt-20 min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-3xl font-bold mb-4 md:mb-0">Tool Categories</h1>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search tools..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter size={18} />
                Sort
                {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {showFilters && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 border border-gray-200">
                  <div className="p-2">
                    <button
                      className={`w-full text-left px-3 py-2 rounded-md ${sortOption === 'name-asc' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                      onClick={() => setSortOption('name-asc')}
                    >
                      Name (A-Z)
                    </button>
                    <button
                      className={`w-full text-left px-3 py-2 rounded-md ${sortOption === 'name-desc' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                      onClick={() => setSortOption('name-desc')}
                    >
                      Name (Z-A)
                    </button>
                    <button
                      className={`w-full text-left px-3 py-2 rounded-md ${sortOption === 'price-asc' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                      onClick={() => setSortOption('price-asc')}
                    >
                      Price (Low to High)
                    </button>
                    <button
                      className={`w-full text-left px-3 py-2 rounded-md ${sortOption === 'price-desc' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                      onClick={() => setSortOption('price-desc')}
                    >
                      Price (High to Low)
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="primary"
              className="flex items-center gap-2"
              onClick={() => navigate('/basket')}
            >
              <ShoppingCart size={18} />
              Cart ({totalItems})
            </Button>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-64 flex-shrink-0">
            <CategoryFilter 
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={handleCategoryClick}
            />
          </div>
          <div className="flex-1">
            {selectedCategory || searchQuery ? (
              <h2 className="text-xl font-bold mb-4">
                {selectedCategory ? `${selectedCategory} (${sortedProducts.length})` : `Search Results (${sortedProducts.length})`}
              </h2>
            ) : (
              <h2 className="text-xl font-bold mb-4">All Tools ({sortedProducts.length})</h2>
            )}

            <ProductGrid 
              products={sortedProducts}
              onAddToCart={handleAddToCart}
              loading={loading}
              error={error}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
