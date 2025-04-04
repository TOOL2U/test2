import React, { useState, useEffect } from 'react';
import { Wrench, Hammer, Save as Saw, Filter, Search } from 'lucide-react';
import ProductGrid from '../components/ProductGrid';
import CategoryFilter from '../components/CategoryFilter';
import Breadcrumbs from '../components/Breadcrumbs';
import AnimateOnScroll from '../components/AnimateOnScroll';

// Mock data for categories
const categories = [
  { id: 'power-tools', name: 'Power Tools', icon: Wrench },
  { id: 'hand-tools', name: 'Hand Tools', icon: Wrench },
  { id: 'construction', name: 'Construction', icon: Hammer },
  { id: 'woodworking', name: 'Woodworking', icon: Saw },
];

// Mock data for products
const allProducts = [
  {
    id: '1',
    name: 'Professional Drill',
    category: 'power-tools',
    price: 15.99,
    image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&q=80',
    rating: 4.5,
    available: true
  },
  {
    id: '2',
    name: 'Hammer Set',
    category: 'hand-tools',
    price: 9.99,
    image: 'https://images.unsplash.com/photo-1586864387789-628af9feed72?auto=format&fit=crop&q=80',
    rating: 4.2,
    available: true
  },
  {
    id: '3',
    name: 'Circular Saw',
    category: 'power-tools',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80',
    rating: 4.7,
    available: false
  },
  {
    id: '4',
    name: 'Wrench Set',
    category: 'hand-tools',
    price: 12.99,
    image: 'https://images.unsplash.com/photo-1581147036324-c1c88bb273b4?auto=format&fit=crop&q=80',
    rating: 4.0,
    available: true
  },
  {
    id: '5',
    name: 'Table Saw',
    category: 'woodworking',
    price: 35.99,
    image: 'https://images.unsplash.com/photo-1575908539614-ff89490f4a78?auto=format&fit=crop&q=80',
    rating: 4.8,
    available: true
  },
  {
    id: '6',
    name: 'Concrete Mixer',
    category: 'construction',
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80',
    rating: 4.3,
    available: true
  },
  {
    id: '7',
    name: 'Chainsaw',
    category: 'power-tools',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&q=80',
    rating: 4.6,
    available: true
  },
  {
    id: '8',
    name: 'Screwdriver Set',
    category: 'hand-tools',
    price: 8.99,
    image: 'https://images.unsplash.com/photo-1581147036324-c1c88bb273b4?auto=format&fit=crop&q=80',
    rating: 4.1,
    available: true
  }
];

const CategoriesPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(allProducts);
  const [showFilters, setShowFilters] = useState(false);

  // Custom breadcrumb paths for this page
  const breadcrumbPaths = [
    { path: '/', label: 'Home' },
    { path: '/categories', label: 'Tool Categories' }
  ];

  useEffect(() => {
    // Filter products based on category and search query
    let filtered = allProducts;
    
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) || 
        product.category.toLowerCase().includes(query)
      );
    }
    
    setFilteredProducts(filtered);
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 mt-16">
        <Breadcrumbs customPaths={breadcrumbPaths} className="mb-6" />
        
        <AnimateOnScroll>
          <h1 className="text-3xl font-bold mb-8 text-center">Browse Our Tool Categories</h1>
        </AnimateOnScroll>
        
        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="relative w-full md:w-auto flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search tools..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <button 
            className="md:hidden flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg border border-gray-300"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-5 w-5" />
            Filters
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Category Filters - Hidden on mobile until toggled */}
          <div className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-64 flex-shrink-0`}>
            <CategoryFilter 
              categories={categories} 
              selectedCategory={selectedCategory}
              onSelectCategory={(category) => {
                setSelectedCategory(category === selectedCategory ? null : category);
                setShowFilters(false);
              }}
            />
          </div>
          
          {/* Product Grid */}
          <div className="flex-grow">
            <ProductGrid products={filteredProducts} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
