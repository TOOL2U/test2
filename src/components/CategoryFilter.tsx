import React from 'react';
import { Tag } from 'lucide-react';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string | null;
  onCategorySelect: (category: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="font-bold text-lg mb-4 flex items-center">
        <Tag className="mr-2 h-5 w-5" />
        Categories
      </h3>
      
      <div className="space-y-1">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategorySelect(category)}
            className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
              selectedCategory === category
                ? 'bg-[#FFD700]/20 text-[#B8860B] font-medium'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
