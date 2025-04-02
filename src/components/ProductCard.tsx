import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  id: number;
  name: string;
  categories: string[];
  description: string;
  imageUrl: string;
  price: number;
  quantity: number;
  onAddToCart: () => void;
  brandColor?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  categories,
  description,
  imageUrl,
  price,
  quantity,
  onAddToCart,
  brandColor = "#FFF02B"
}) => {
  return (
    <motion.div 
      id={`product-${id}`} // Added unique id for each product card
      className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 border border-gray-100"
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl || `https://source.unsplash.com/300x200/?tool,${name}`}
          alt={name}
          className="w-full h-full object-contain transition-transform duration-300 hover:scale-110"
        />
        {categories.length > 0 && (
          <div className="absolute top-2 left-2">
            <span 
              className="text-gray-800 text-xs font-medium px-2.5 py-1 rounded"
              style={{ backgroundColor: brandColor }}
            >
              {categories[0]}
            </span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-1 text-gray-800 line-clamp-1">{name}</h3>
        
        <div className="text-sm text-gray-500 mb-3 line-clamp-2">
          {description}
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <div className="text-lg font-bold text-gray-900">
              ฿{price.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">
              {quantity > 0 ? `${quantity} in stock` : 'Out of stock'}
            </div>
          </div>
          
          <motion.button
            onClick={onAddToCart}
            className="text-gray-800 p-2 rounded-full transition-colors"
            style={{ backgroundColor: brandColor }}
            whileTap={{ scale: 0.9 }}
            disabled={quantity <= 0}
            aria-label="Add to cart"
          >
            <ShoppingCart size={20} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
