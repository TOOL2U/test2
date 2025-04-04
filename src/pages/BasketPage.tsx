import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ArrowRight, ShoppingCart } from 'lucide-react';
import Button from '../components/Button';
import Breadcrumbs from '../components/Breadcrumbs';
import AnimateOnScroll from '../components/AnimateOnScroll';

const BasketPage: React.FC = () => {
  const { items, updateQuantity, removeItem, clearCart } = useCart();
  
  // Calculate totals
  const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  const deliveryFee = subtotal > 0 ? 5.99 : 0;
  const total = subtotal + deliveryFee;
  
  // Custom breadcrumb paths for this page
  const breadcrumbPaths = [
    { path: '/', label: 'Home' },
    { path: '/basket', label: 'Shopping Cart' }
  ];

  if (items.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen pt-20">
        <div className="container mx-auto px-4 py-8">
          <Breadcrumbs customPaths={breadcrumbPaths} className="mb-6" />
          
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-6">Looks like you haven't added any tools to your cart yet.</p>
            <Link to="/categories">
              <Button variant="primary" className="inline-flex items-center">
                Browse Tools
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pt-20">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs customPaths={breadcrumbPaths} className="mb-6" />
        
        <AnimateOnScroll>
          <h1 className="text-3xl font-bold mb-8">Your Shopping Cart</h1>
        </AnimateOnScroll>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="lg:w-2/3">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Cart Items ({items.length})</h2>
                <button 
                  onClick={clearCart}
                  className="text-red-500 hover:text-red-700 text-sm flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear Cart
                </button>
              </div>
              
              <ul className="divide-y divide-gray-200">
                {items.map((item) => (
                  <li key={item.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-20 h-20 object-cover rounded-md"
                    />
                    
                    <div className="flex-grow">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-gray-500 text-sm">Category: {item.category}</p>
                      <p className="text-[#FFD700] font-bold mt-1">${item.price.toFixed(2)} / day</p>
                    </div>
                    
                    <div className="flex items-center">
                      <button 
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      
                      <span className="mx-3 w-8 text-center">{item.quantity}</span>
                      
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700 text-sm mt-1 flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span>${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3 mt-3 flex justify-between font-bold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              
              <Link to="/checkout">
                <Button variant="primary" className="w-full flex items-center justify-center">
                  Proceed to Checkout
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              
              <Link to="/categories" className="mt-4 text-center block text-gray-600 hover:text-gray-800">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasketPage;
