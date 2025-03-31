import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import { Package, Truck, CheckCircle, Clock, AlertTriangle, CreditCard, Map } from 'lucide-react';

export default function OrdersPage() {
  const { orders, verifyPayment } = useOrders();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'payment_verification':
        return <CreditCard className="w-5 h-5 text-orange-500" />;
      case 'processing':
        return <Truck className="w-5 h-5 text-blue-500" />;
      case 'delivered':
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'payment_verification':
        return 'Payment Verification';
      case 'processing':
        return 'Processing';
      case 'delivered':
        return 'Delivered';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'payment_verification':
        return 'bg-orange-100 text-orange-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleVerifyPayment = (orderId: string) => {
    verifyPayment(orderId);
  };

  return (
    <div className="pt-20">
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Orders Yet</h2>
            <p className="text-gray-600 mb-6">
              You haven't placed any orders yet. Start shopping to see your orders here.
            </p>
            <Link
              to="/categories"
              className="bg-[#FFD700] text-gray-900 px-6 py-3 rounded-lg font-bold hover:bg-[#FFE44D] transition-colors inline-block"
            >
              Browse Tools
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div
                  className="p-6 border-b cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleOrderExpansion(order.id)}
                >
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center">
                        <h2 className="text-xl font-semibold">Order #{order.id}</h2>
                        <span className={`ml-3 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1">
                        Placed on {formatDate(order.orderDate)}
                      </p>
                      <p className="text-gray-600 mt-1">
                        Total: {(order.totalAmount + order.deliveryFee).toFixed(2)} THB
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      {order.status === 'processing' && (
                        <Link
                          to={`/track-order?order_id=${order.id}`}
                          className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Truck className="w-4 h-4 mr-1" />
                          Track Order
                        </Link>
                      )}
                      {(order.status === 'delivered' || order.status === 'completed') && (
                        <Link
                          to={`/track-order?order_id=${order.id}`}
                          className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Map className="w-4 h-4 mr-1" />
                          Track My Order
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {expandedOrderId === order.id && (
                  <div className="p-6 border-t border-gray-100">
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Order Status</h3>
                      <div className="flex items-center">
                        {getStatusIcon(order.status)}
                        <span className="ml-2">{getStatusText(order.status)}</span>
                      </div>
                      
                      {/* Payment verification action */}
                      {order.status === 'payment_verification' && (
                        <div className="mt-4 bg-yellow-50 p-4 rounded-lg">
                          <h4 className="font-medium text-yellow-800 mb-2">Payment Verification Required</h4>
                          <p className="text-yellow-700 mb-3">
                            Please complete your payment and click the button below once payment is sent.
                          </p>
                          <button
                            onClick={() => handleVerifyPayment(order.id)}
                            className="bg-[#FFD700] text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#FFE44D] transition-colors"
                          >
                            I've Completed Payment
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Delivery Information</h3>
                      <p className="text-gray-700">{order.deliveryAddress}</p>
                      {order.distance && (
                        <p className="text-gray-700 mt-1">Distance: {order.distance.toFixed(1)} km</p>
                      )}
                      <p className="text-gray-700 mt-1">Delivery Fee: {order.deliveryFee.toFixed(2)} THB</p>
                    </div>

                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Items</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Item
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Quantity
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Days
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Price
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Subtotal
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {order.items.map((item, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    {item.image && (
                                      <img
                                        src={item.image}
                                        alt={item.name}
                                        className="h-10 w-10 object-cover mr-3"
                                      />
                                    )}
                                    <div>
                                      <div className="font-medium text-gray-900">{item.name}</div>
                                      <div className="text-gray-500">{item.brand}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                                  {item.quantity}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                                  {item.days || 1}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                                  {item.price.toFixed(2)} THB
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                                  {(item.price * item.quantity * (item.days || 1)).toFixed(2)} THB
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan={4} className="px-6 py-4 text-right font-medium">
                                Subtotal
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                                {order.totalAmount.toFixed(2)} THB
                              </td>
                            </tr>
                            <tr>
                              <td colSpan={4} className="px-6 py-4 text-right font-medium">
                                Delivery Fee
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                                {order.deliveryFee.toFixed(2)} THB
                              </td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td colSpan={4} className="px-6 py-4 text-right font-bold">
                                Total
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap font-bold">
                                {(order.totalAmount + order.deliveryFee).toFixed(2)} THB
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold mb-2">Payment Method</h3>
                        <p className="text-gray-700">
                          {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Bank Transfer'}
                        </p>
                      </div>
                      
                      <div className="flex space-x-3">
                        {order.status === 'processing' && (
                          <Link
                            to={`/track-order?order_id=${order.id}`}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center"
                          >
                            <Truck className="w-4 h-4 mr-1" />
                            Track Order
                          </Link>
                        )}
                        {(order.status === 'delivered' || order.status === 'completed') && (
                          <Link
                            to={`/track-order?order_id=${order.id}`}
                            className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center"
                          >
                            <Map className="w-4 h-4 mr-1" />
                            Track My Order
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
