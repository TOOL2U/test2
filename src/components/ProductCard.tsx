import React, { useState } from 'react';
import { ShoppingCart, Check, ImageOff } from 'lucide-react';
import Button from './Button';

interface ProductCardProps {
  id: number;
  name: string;
  categories: string[];
  description: string;
  imageUrl: string;
  price: number;
  onAddToCart: () => void;
  quantity: number;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  categories,
  description,
  imageUrl,
  price,
  onAddToCart,
  quantity
}) => {
  const [isAdded, setIsAdded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleAddToCart = () => {
    onAddToCart();
    setIsAdded(true);
    
    // Reset the added state after 2 seconds
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {/* Loading skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-[#FFD700] rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* Image with error fallback */}
        {imageError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 p-4">
            <ImageOff className="w-10 h-10 text-gray-400 mb-2" />
            <p className="text-gray-500 text-sm text-center">Image not available</p>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={name}
            className={`w-full h-full object-contain transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading="lazy"
          />
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1 line-clamp-1">{name}</h3>
        <div className="flex flex-wrap gap-1 mb-2">
          {categories.slice(0, 2).map((category, index) => (
            <span
              key={index}
              className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full"
            >
              {category}
            </span>
          ))}
        </div>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{description}</p>
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold">฿{price}/day</span>
          <Button
            variant={isAdded ? "success" : "primary"}
            size="sm"
            onClick={handleAddToCart}
            disabled={quantity <= 0 || isAdded}
            className="flex items-center gap-1"
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4" />
                Added to Cart
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                {quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
