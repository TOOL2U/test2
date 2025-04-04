import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Code, 
  Database, 
  Server, 
  Globe, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Map,
  Webhook
} from 'lucide-react';
import PrelaunchChecker from '../components/PrelaunchChecker';
import NotificationTester from '../components/NotificationTester';

const DevelopersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'prelaunch' | 'notifications' | 'api'>('prelaunch');
  
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
          
          <h1 className="text-2xl font-bold">Developer Tools</h1>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('prelaunch')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'prelaunch'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Pre-launch Checks
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Webhook className="w-5 h-5 mr-2" />
                Notification Testing
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('api')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'api'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Code className="w-5 h-5 mr-2" />
                API Documentation
              </div>
            </button>
          </nav>
        </div>
        
        {/* Tab content */}
        <div className="grid grid-cols-1 gap-6">
          {activeTab === 'prelaunch' && (
            <div>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      This tool performs comprehensive pre-launch checks on your website to identify potential issues before going live.
                      Run these checks on each page to ensure everything is working correctly.
                    </p>
                  </div>
                </div>
              </div>
              
              <PrelaunchChecker />
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center mb-4">
                    <Map className="w-6 h-6 text-blue-500 mr-2" />
                    <h3 className="text-lg font-bold">Maps Integration</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Test Google Maps integration on the following pages:
                  </p>
                  <ul className="space-y-2">
                    <li>
                      <Link to="/driver-tracking?order_id=ORD-12345&code=DRIVER123" className="text-blue-600 hover:underline">
                        Driver Tracking Page
                      </Link>
                    </li>
                    <li>
                      <Link to="/staff-tracking" className="text-blue-600 hover:underline">
                        Staff Tracking Page
                      </Link>
                    </li>
                    <li>
                      <Link to="/track-order?order_id=ORD-12345" className="text-blue-600 hover:underline">
                        Customer Order Tracking
                      </Link>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center mb-4">
                    <Database className="w-6 h-6 text-green-500 mr-2" />
                    <h3 className="text-lg font-bold">Data Management</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Verify data integrity on these pages:
                  </p>
                  <ul className="space-y-2">
                    <li>
                      <Link to="/orders" className="text-blue-600 hover:underline">
                        Orders Page
                      </Link>
                    </li>
                    <li>
                      <Link to="/staff-dashboard" className="text-blue-600 hover:underline">
                        Staff Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link to="/back-office" className="text-blue-600 hover:underline">
                        Back Office
                      </Link>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center mb-4">
                    <Zap className="w-6 h-6 text-yellow-500 mr-2" />
                    <h3 className="text-lg font-bold">Performance</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Check performance on high-traffic pages:
                  </p>
                  <ul className="space-y-2">
                    <li>
                      <Link to="/" className="text-blue-600 hover:underline">
                        Home Page
                      </Link>
                    </li>
                    <li>
                      <Link to="/categories" className="text-blue-600 hover:underline">
                        Categories Page
                      </Link>
                    </li>
                    <li>
                      <Link to="/checkout" className="text-blue-600 hover:underline">
                        Checkout Flow
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      Use these tools to test the notification system. Enter your email address to receive test notifications.
                      This helps verify that webhooks and email delivery are working correctly.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <NotificationTester />
                
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold mb-4">Webhook Endpoints</h3>
                  
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-md p-4">
                      <h4 className="font-medium mb-2">Order Notifications</h4>
                      <div className="bg-gray-50 p-2 rounded text-sm font-mono break-all">
                        https://hook.eu2.make.com/vu3s7gc6ao5gmun1o1t976566txn5t1c
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Used for general order updates and status changes
                      </p>
                    </div>
                    
                    <div className="border border-gray-200 rounded-md p-4">
                      <h4 className="font-medium mb-2">"On Our Way" Notifications</h4>
                      <div className="bg-gray-50 p-2 rounded text-sm font-mono break-all">
                        https://hook.eu2.make.com/ypfohgahgryyt3pt1focq7sa8imj7m3t
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Specifically for notifying customers when their order is on the way
                      </p>
                    </div>
                    
                    <div className="border border-gray-200 rounded-md p-4">
                      <h4 className="font-medium mb-2">User Registration</h4>
                      <div className="bg-gray-50 p-2 rounded text-sm font-mono break-all">
                        https://hook.eu2.make.com/3c2hi7mvxnftvbj2yvxo2n1u2qja80hh
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Used when new users register on the platform
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'api' && (
            <div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold mb-4">API Documentation</h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium mb-2">Order API</h4>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="font-mono text-sm mb-2">GET /api/orders</p>
                      <p className="text-gray-600 text-sm">Retrieves all orders for the authenticated user</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md mt-2">
                      <p className="font-mono text-sm mb-2">GET /api/orders/:id</p>
                      <p className="text-gray-600 text-sm">Retrieves a specific order by ID</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md mt-2">
                      <p className="font-mono text-sm mb-2">POST /api/orders</p>
                      <p className="text-gray-600 text-sm">Creates a new order</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md mt-2">
                      <p className="font-mono text-sm mb-2">PUT /api/orders/:id/status</p>
                      <p className="text-gray-600 text-sm">Updates the status of an order</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-medium mb-2">User API</h4>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="font-mono text-sm mb-2">POST /api/users/register</p>
                      <p className="text-gray-600 text-sm">Registers a new user</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md mt-2">
                      <p className="font-mono text-sm mb-2">POST /api/users/login</p>
                      <p className="text-gray-600 text-sm">Authenticates a user and returns a token</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md mt-2">
                      <p className="font-mono text-sm mb-2">GET /api/users/profile</p>
                      <p className="text-gray-600 text-sm">Retrieves the profile of the authenticated user</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-medium mb-2">Product API</h4>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="font-mono text-sm mb-2">GET /api/products</p>
                      <p className="text-gray-600 text-sm">Retrieves all products</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md mt-2">
                      <p className="font-mono text-sm mb-2">GET /api/products/:id</p>
                      <p className="text-gray-600 text-sm">Retrieves a specific product by ID</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md mt-2">
                      <p className="font-mono text-sm mb-2">GET /api/products/category/:category</p>
                      <p className="text-gray-600 text-sm">Retrieves products by category</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DevelopersPage;
