import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Button from '../components/Button';
import ProductGrid from '../components/ProductGrid';
import AnimateOnScroll from '../components/AnimateOnScroll';
import { useProducts, Product } from '../utils/productService';
import { motion } from 'framer-motion';

const CategoriesPage: React.FC = () => {
  const { products, loading, error } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'price-asc' | 'price-desc' | 'name-asc' | 'name-desc'>('name-asc');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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
      price: product.price,
      deposit: product.deposit || 0
    });

    // Update the product card to show "Added to Cart" instead of the button
    const productElement = document.getElementById(`product-${product.id}`);
    if (productElement) {
      const button = productElement.querySelector('button');
      if (button) {
        button.textContent = 'Added to Cart';
        button.disabled = true;
        button.classList.add('bg-green-500', 'text-black');
      }
    }
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category === selectedCategory ? null : category);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Already filtering in real-time, but could add additional logic here
  };

  // Get category image based on category name - simplified minimalist icons
  const getCategoryIcon = (category: string) => {
    // Map of category names to minimalist SVG icons
    const categoryIcons: Record<string, string> = {
      'Aerial Work Platforms': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" /><path d="M17 2l-5 5-5-5" /><path d="M12 12v6" /><path d="M8 12h8" /></svg>`,
      'Air Compressors': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /><path d="M12 8v8" /></svg>`,
      'Compaction': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M6 8h.01" /><path d="M18 8h.01" /><path d="M12 8v8" /><path d="M8 16h8" /></svg>`,
      'Concrete': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20" /><path d="M6 8v8" /><path d="M18 8v8" /><path d="M12 4v16" /></svg>`,
      'Cooling': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v8" /><path d="M12 18v4" /><path d="M4.93 10.93l6.36 6.36" /><path d="M18.36 6.64l-6.36 6.36" /><path d="M2 12h4" /><path d="M18 12h4" /></svg>`,
      'Earth Moving': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15h18" /><path d="M3 19h18" /><path d="M8 11V7c0-1.1.9-2 2-2h4a2 2 0 0 1 2 2v4" /><path d="M18 11H6a2 2 0 0 0-2 2v2" /></svg>`,
      'Floor Care': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 7h10" /><path d="M7 12h10" /><path d="M7 17h10" /></svg>`,
      'Forklifts': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16" /><path d="M6 8h12" /><path d="M8 20h8" /><path d="M4 12h16" /></svg>`,
      'General Construction': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>`,
      'Generators': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20" /><path d="M4 12H2" /><path d="M10 12H8" /><path d="M16 12h-2" /><path d="M22 12h-2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="m4.93 19.07 1.41-1.41" /><path d="m17.66 6.34 1.41-1.41" /></svg>`,
      'Ground Protection': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /><path d="M15 3v18" /></svg>`,
      'Lawn': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v8" /><path d="M5 10H2" /><path d="M5 14H2" /><path d="M22 10h-3" /><path d="M22 14h-3" /><path d="M8 18l4 4 4-4" /><path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /></svg>`,
      'Load Banks': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 12h.01" /><path d="M10 12h.01" /><path d="M14 12h.01" /><path d="M18 12h.01" /></svg>`,
      'Portable Ice Rinks': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v12" /><path d="M6 12h12" /></svg>`,
      'Pumps': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20" /><path d="M20 2v20" /><path d="M12 14v4" /><path d="M12 6v4" /><circle cx="12" cy="12" r="2" /></svg>`,
      'Refrigeration': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M12 6v12" /><path d="M8 10h8" /></svg>`,
      'Temporary Containment': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16" /><path d="M4 20h16" /><path d="M4 4v16" /><path d="M20 4v16" /><path d="M9 4v16" /><path d="M14 4v16" /></svg>`,
      'Temporary Fencing': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16" /><path d="M4 20h16" /><path d="M4 4v16" /><path d="M20 4v16" /><path d="M4 12h16" /></svg>`,
      'Temporary Structures': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>`,
      'Trench': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 22h20" /><path d="M5 4v18" /><path d="M19 4v18" /><path d="M5 4h14" /></svg>`,
    };

    // Convert SVG to data URL
    const getSvgUrl = (svgString: string) => {
      // Replace currentColor with the brand yellow
      const coloredSvg = svgString.replace(/currentColor/g, '#FFF02B');
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(coloredSvg)}`;
    };

    // Return the SVG data URL for the category, or a fallback
    return categoryIcons[category] 
      ? getSvgUrl(categoryIcons[category]) 
      : `data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23FFF02B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Moved to top and full-width */}
      <div 
        className="relative bg-cover bg-center h-[500px] w-full mb-12"
        style={{ backgroundImage: 'url(https://i.imgur.com/UqhFQg6.jpeg)' }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 text-center">
            Find the Right Tools for You
          </h2>
          
          <p className="text-white text-base md:text-lg mb-6 max-w-2xl mx-auto text-center">
            Tool2u has more than 50,000 pieces of equipment and tools for all your needs
          </p>
          
          {/* Search Bar */}
          <form 
            onSubmit={handleSearch}
            className="w-full max-w-xl mx-auto"
          >
            <div 
              className={`flex items-center transition-all duration-300 ease-in-out ${
                isSearchFocused ? 'transform scale-105' : ''
              }`}
            >
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Search for tools..."
                  className="w-full py-3 pl-12 pr-4 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#FFF02B] text-gray-800"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              </div>
              <button
                type="submit"
                className="bg-[#FFF02B] hover:bg-[#F0E100] text-gray-800 font-medium py-3 px-6 rounded-r-lg transition-colors"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        {/* All Categories Section */}
        <AnimateOnScroll>
          <h1 className="text-3xl font-bold mb-8 text-gray-800">All Categories</h1>
        </AnimateOnScroll>
        
        {/* Category Grid - New Design with minimalist icons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
          {categories.map((category, index) => (
            <AnimateOnScroll key={category} delay={index * 50}>
              <motion.button
                onClick={() => handleCategoryClick(category)}
                className={`flex items-center p-4 rounded-lg border transition-all duration-200 w-full ${
                  selectedCategory === category 
                    ? 'bg-[#FFFBCC] border-[#FFF02B] shadow-sm' 
                    : 'bg-white border-gray-200 hover:border-[#FFF02B] hover:shadow-sm'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex-shrink-0 mr-4 w-12 h-12 flex items-center justify-center">
                  <img 
                    src={getCategoryIcon(category)}
                    alt={category}
                    className="w-8 h-8" 
                  />
                </div>
                <span className={`text-base font-medium ${
                  selectedCategory === category ? 'text-gray-800' : 'text-gray-700'
                }`}>
                  {category}
                </span>
              </motion.button>
            </AnimateOnScroll>
          ))}
        </div>

        {/* Sort Options */}
        <div className="flex flex-wrap items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {selectedCategory ? `${selectedCategory} (${sortedProducts.length})` : 
               searchQuery ? `Search Results (${sortedProducts.length})` : 
               `All Tools (${sortedProducts.length})`}
            </h2>
          </div>
          
          <div className="flex items-center mt-4 sm:mt-0">
            <span className="text-gray-600 mr-2">Sort by:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFF02B]"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="price-asc">Price (Low to High)</option>
              <option value="price-desc">Price (High to Low)</option>
            </select>
            
            <Button
              variant="outline"
              className="ml-4 flex items-center gap-2"
              onClick={() => navigate('/basket')}
            >
              <ShoppingCart size={18} />
              Cart ({totalItems})
            </Button>
          </div>
        </div>

        {/* Product Grid */}
        <ProductGrid 
          products={sortedProducts}
          onAddToCart={handleAddToCart}
          loading={loading}
          error={error}
          brandColor="#FFF02B"
        />
      </div>
    </div>
  );
};

export default CategoriesPage;
