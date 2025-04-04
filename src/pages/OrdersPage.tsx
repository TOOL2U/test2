import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import { Package, ChevronDown, ChevronUp, Clock, CheckCircle, AlertTriangle, XCircle, Truck, MapPin } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import AnimateOnScroll from '../components/AnimateOnScroll';

const OrdersPage: React.FC = () => {
  const { orders } = useOrders();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  
  // Custom breadcrumb paths for this page
  const breadcrumbPaths = [
    { path: '/', label: 'Home' },
    { path: '/orders', label: 'My Orders' }
  ];

  const toggleOrder = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'payment_verification':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'payment_verification':
        return 'Payment Verification';
      case 'shipped':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'payment_verification':
        return 'bg-orange-100 text-orange-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (orders.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen pt-20">
        <div className="container mx-auto px-4 py-8">
          <Breadcrumbs customPaths={breadcrumbPaths} className="mb-6" />
          
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h1 className="text-2xl font-bold mb-4">No Orders Yet</h1>
            <p className="text-gray-600 mb-6">You haven't placed any orders yet. Start shopping to see your orders here.</p>
            <Link 
              to="/categories"
              className="bg-[#FFD700] text-gray-900 px-6 py-3 rounded-lg font-bold hover:bg-[#FFE44D] transition-colors inline-flex items-center"
            >
              Browse Tools
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
          <h1 className="text-3xl font-bold mb-8">My Orders</h1>
        </AnimateOnScroll>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Order History</h2>
          </div>
          
          <ul className="divide-y divide-gray-200">
            {orders.map((order) => (
              <li key={order.id} className="p-4">
                <div 
                  className="flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer"
                  onClick={() => toggleOrder(order.id)}
                >
                  <div className="flex items-center mb-2 md:mb-0">
                    <div className="mr-4">
                      {getStatusIcon(order.status)}
                    </div>
                    <div>
                      <h3 className="font-medium">Order #{order.id}</h3>
                      <p className="text-gray-500 text-sm">
                        {new Date(order.date).toLocaleDateString()} • {order.items.length} item(s)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium mr-4 ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                    <span className="font-bold mr-4">${order.total.toFixed(2)}</span>
                    {expandedOrder === order.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
                
                {expandedOrder === order.id && (
                  <div className="mt-4 border-t pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Order Details</h4>
                        <ul className="space-y-2">
                          {order.items.map((item, index) => (
                            <li key={index} className="flex justify-between">
                              <span className="text-gray-600">
                                {item.name} x{item.quantity}
                              </span>
                              <span>${(item.price * item.quantity).toFixed(2)}</span>
                            </li>
                          ))}
                          <li className="flex justify-between border-t pt-2 font-bold">
                            <span>Total</span>
                            <span>${order.total.toFixed(2)}</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Delivery Information</h4>
                        <div className="space-y-2 text-gray-600">
                          <p className="flex items-start">
                            <MapPin className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
                            <span>{order.deliveryAddress}</span>
                          </p>
                          {order.status === 'shipped' && (
                            <Link 
                              to={`/track-order/${order.id}`}
                              className="inline-block mt-2 text-[#FFD700] hover:underline"
                            >
                              Track Delivery
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
