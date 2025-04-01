import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import NotificationTester from '../components/NotificationTester';
import { ArrowLeft, Truck, Bell, MapPin, Settings, Users, Package } from 'lucide-react';

export default function StaffDashboardPage() {
  const { orders, updateOrderStatus } = useOrders();
  const [activeTab, setActiveTab] = useState('orders');

  // Filter orders based on status
  const processingOrders = orders.filter(order => order.status === 'processing');
  const completedOrders = orders.filter(order => ['delivered', 'completed'].includes(order.status));

  return (
    <div className="pt-20">
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <Link 
            to="/"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-2xl font-bold">Staff Dashboard</h1>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-[#FFD700] text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="w-5 h-5 inline mr-2" />
              Orders
            </button>
            <button
              onClick={() => setActiveTab('tracking')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tracking'
                  ? 'border-[#FFD700] text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Truck className="w-5 h-5 inline mr-2" />
              Driver Tracking
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notifications'
                  ? 'border-[#FFD700] text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Bell className="w-5 h-5 inline mr-2" />
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-[#FFD700] text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="w-5 h-5 inline mr-2" />
              Settings
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'orders' && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b">
                  <h2 className="text-xl font-bold">Active Orders</h2>
                </div>
                
                {processingOrders.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No active orders at the moment
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {processingOrders.map(order => (
                          <tr key={order.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.customerInfo.name}<br />
                              <span className="text-xs">{order.customerInfo.phone}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{order.deliveryAddress}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                value={order.status}
                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                className="text-sm border-gray-300 rounded-md"
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="delivered">Delivered</option>
                                <option value="completed">Completed</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <Link
                                  to={`/driver-tracking?order_id=${order.id}&code=DRIVER123`}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Track
                                </Link>
                                <Link
                                  to={`/staff-tracking`}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Manage
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'tracking' && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b">
                  <h2 className="text-xl font-bold">Driver Tracking</h2>
                </div>
                
                <div className="p-6">
                  <p className="text-gray-600 mb-6">
                    Track your delivery drivers in real-time and manage their routes.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link
                      to="/staff-tracking"
                      className="bg-blue-50 p-6 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
                    >
                      <MapPin className="w-8 h-8 text-blue-500 mb-2" />
                      <h3 className="font-bold text-lg mb-1">Staff Tracking Dashboard</h3>
                      <p className="text-sm text-gray-600">
                        Monitor all active drivers and deliveries in real-time
                      </p>
                    </Link>
                    
                    <Link
                      to={`/driver-tracking?order_id=${processingOrders[0]?.id || 'ORD-12345'}&code=DRIVER123`}
                      className="bg-green-50 p-6 rounded-lg border border-green-100 hover:bg-green-100 transition-colors"
                    >
                      <Truck className="w-8 h-8 text-green-500 mb-2" />
                      <h3 className="font-bold text-lg mb-1">Driver View</h3>
                      <p className="text-sm text-gray-600">
                        Access the driver's interface for location tracking
                      </p>
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b">
                  <h2 className="text-xl font-bold">Notification System</h2>
                </div>
                
                <div className="p-6">
                  <p className="text-gray-600 mb-6">
                    Manage and test the automated customer notification system.
                  </p>
                  
                  <NotificationTester />
                </div>
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b">
                  <h2 className="text-xl font-bold">System Settings</h2>
                </div>
                
                <div className="p-6">
                  <h3 className="font-bold text-lg mb-4">Notification Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">Customer Arrival Notifications</h4>
                        <p className="text-sm text-gray-600">
                          Send email when driver is 1km away from customer
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={true} className="sr-only peer" readOnly />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">Notification Distance Threshold</h4>
                        <p className="text-sm text-gray-600">
                          Distance at which to trigger customer notifications
                        </p>
                      </div>
                      <select className="border-gray-300 rounded-md">
                        <option value="0.5">0.5 km</option>
                        <option value="1.0" selected>1.0 km</option>
                        <option value="1.5">1.5 km</option>
                        <option value="2.0">2.0 km</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">Webhook Integration</h4>
                        <p className="text-sm text-gray-600">
                          Make.com webhook URL for notifications
                        </p>
                      </div>
                      <input 
                        type="text" 
                        value="https://hook.eu2.make.com/51kxwhrvgtagkojqethkwq5pdv2sttn0" 
                        className="border-gray-300 rounded-md text-sm w-64 bg-gray-100"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="p-4 border-b">
                <h2 className="font-bold">Quick Actions</h2>
              </div>
              
              <div className="p-4">
                <ul className="space-y-2">
                  <li>
                    <Link
                      to="/staff-tracking"
                      className="flex items-center p-2 rounded-lg hover:bg-gray-50"
                    >
                      <MapPin className="w-5 h-5 mr-3 text-blue-500" />
                      <span>Track All Drivers</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to={`/driver-tracking?order_id=${processingOrders[0]?.id || 'ORD-12345'}&code=DRIVER123`}
                      className="flex items-center p-2 rounded-lg hover:bg-gray-50"
                    >
                      <Truck className="w-5 h-5 mr-3 text-green-500" />
                      <span>Driver View</span>
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab('notifications')}
                      className="flex items-center p-2 rounded-lg hover:bg-gray-50 w-full text-left"
                    >
                      <Bell className="w-5 h-5 mr-3 text-yellow-500" />
                      <span>Test Notifications</span>
                    </button>
                  </li>
                  <li>
                    <Link
                      to="/orders"
                      className="flex items-center p-2 rounded-lg hover:bg-gray-50"
                    >
                      <Package className="w-5 h-5 mr-3 text-purple-500" />
                      <span>View All Orders</span>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="font-bold">System Status</h2>
              </div>
              
              <div className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Notification System</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Webhook Integration</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Connected
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Drivers</span>
                    <span className="text-sm font-medium">{processingOrders.length}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completed Orders</span>
                    <span className="text-sm font-medium">{completedOrders.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
