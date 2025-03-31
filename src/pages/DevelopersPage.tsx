import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { webhookService } from '../utils/webhookService';
import Button from '../components/Button';
import { Link } from 'react-router-dom';
import { Code, Truck, Map, Navigation } from 'lucide-react';

const DevelopersPage: React.FC = () => {
  const { user } = useAuth();
  const [userWebhookStatus, setUserWebhookStatus] = useState<string>('');
  const [orderWebhookStatus, setOrderWebhookStatus] = useState<string>('');
  const [isUserWebhookLoading, setIsUserWebhookLoading] = useState(false);
  const [isOrderWebhookLoading, setIsOrderWebhookLoading] = useState(false);
  const [userWebhookDetails, setUserWebhookDetails] = useState<string>('');
  const [orderWebhookDetails, setOrderWebhookDetails] = useState<string>('');

  const testUserWebhook = async () => {
    if (!user) {
      setUserWebhookStatus('Error: User not logged in');
      return;
    }

    setIsUserWebhookLoading(true);
    setUserWebhookStatus('Sending webhook...');
    setUserWebhookDetails('');

    try {
      // Use the specialized method for user registration webhook
      const result = await webhookService.sendUserRegistrationWebhook({
        event: "new_customer_signup",
        customer_id: user.id,
        name: user.name || "Test User",
        email: user.email || "test@example.com",
        username: user.username,
        registration_date: new Date().toISOString(),
        location: "Thailand",
        phone: "+66123456789"
      });
      
      setUserWebhookStatus('Webhook sent successfully! Check Make.com for the incoming data.');
      setUserWebhookDetails(`Method: ${result.method || 'simulated'}\nPayload included user ID: ${user.id}, username: ${user.username}, email: ${user.email || 'test@example.com'}`);
      
      console.log("User webhook test result:", result);
    } catch (error) {
      console.error('User webhook test error:', error);
      setUserWebhookStatus(`Error sending webhook: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsUserWebhookLoading(false);
    }
  };

  const testOrderWebhook = async () => {
    if (!user) {
      setOrderWebhookStatus('Error: User not logged in');
      return;
    }

    setIsOrderWebhookLoading(true);
    setOrderWebhookStatus('Sending order webhook...');
    setOrderWebhookDetails('');

    try {
      // Use the specialized method for order webhook
      const result = await webhookService.sendTestOrderWebhook(
        user.id,
        user.name || "Test User",
        user.email || "test@example.com"
      );
      
      setOrderWebhookStatus('Order webhook sent successfully! Check Make.com for the incoming data.');
      setOrderWebhookDetails(`Method: ${result.method || 'simulated'}\nSent test order with customer ID: ${user.id}, name: ${user.name || 'Test User'}`);
      
      console.log("Order webhook test result:", result);
    } catch (error) {
      console.error('Order webhook test error:', error);
      setOrderWebhookStatus(`Error sending order webhook: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsOrderWebhookLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Developer Tools & Utilities</h1>
      
      {/* Staff Dashboard Button */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Staff Access</h2>
        <p className="mb-4">
          Access the staff dashboard to manage orders, track deliveries, and handle customer requests.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/staff-login" className="inline-block">
            <Button 
              variant="secondary" 
              size="default"
              className="flex items-center"
            >
              <Code className="w-4 h-4 mr-1" />
              Go to Staff Dashboard
            </Button>
          </Link>
          
          <Link to="/staff" className="inline-block">
            <Button 
              variant="outline" 
              size="default"
              className="flex items-center"
            >
              <Truck className="w-4 h-4 mr-1" />
              Staff Tracking
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Order Tracking Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Order Tracking</h2>
        <p className="mb-4">
          Access the order tracking pages to view delivery status and driver location.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/track-order?order_id=ORD12345" className="inline-block">
            <Button 
              variant="default" 
              size="default"
              className="flex items-center"
            >
              <Map className="w-4 h-4 mr-1" />
              Customer Tracking
            </Button>
          </Link>
          
          <Link to="/driver-tracking?order_id=ORD12345&code=DRIVER123" className="inline-block">
            <Button 
              variant="outline" 
              size="default"
              className="flex items-center"
            >
              <Navigation className="w-4 h-4 mr-1" />
              Driver View
            </Button>
          </Link>
        </div>
        <p className="mt-3 text-sm text-gray-500">
          Note: These links use demo order IDs. In a real application, you would use actual order IDs.
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Webhook Testing</h2>
        
        {/* User Registration Webhook Section */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="text-lg font-medium mb-2">User Registration Webhook</h3>
          <p className="mb-4">
            Test the user registration webhook integration with Make.com. This will send user registration data to trigger the welcome email flow.
          </p>
          
          <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800">
            <p className="font-medium">Important:</p>
            <p>This button sends user registration data to Make.com, triggering the welcome email flow.</p>
            <p>Webhook URL: https://hook.eu2.make.com/3c2hi7mvxnftvbj2yvxo2n1u2qja80hh</p>
          </div>
          
          <button
            onClick={testUserWebhook}
            disabled={isUserWebhookLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors disabled:bg-blue-400"
          >
            {isUserWebhookLoading ? 'Sending...' : 'Test User Registration Webhook'}
          </button>
          
          {userWebhookStatus && (
            <div className={`mt-4 p-3 rounded ${userWebhookStatus.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
              <p className="font-medium">{userWebhookStatus}</p>
              {userWebhookDetails && <pre className="mt-2 text-sm whitespace-pre-wrap">{userWebhookDetails}</pre>}
              {userWebhookStatus.includes('successfully') && (
                <div className="mt-2 text-sm">
                  <p>Note: In development mode, webhooks may be simulated due to CORS restrictions.</p>
                  <p>The data has been sent using multiple methods to maximize chances of delivery.</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Order Webhook Section */}
        <div>
          <h3 className="text-lg font-medium mb-2">Order Webhook</h3>
          <p className="mb-4">
            Test the order webhook integration with Make.com. This will send a sample order to the order processing flow.
          </p>
          
          <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800">
            <p className="font-medium">Important:</p>
            <p>This button sends a test order to Make.com, which may trigger order processing automations.</p>
            <p>Webhook URL: https://hook.eu2.make.com/vu3s7gc6ao5gmun1o1t976566txn5t1c</p>
          </div>
          
          <button
            onClick={testOrderWebhook}
            disabled={isOrderWebhookLoading}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition-colors disabled:bg-green-400"
          >
            {isOrderWebhookLoading ? 'Sending...' : 'Test Order Webhook'}
          </button>
          
          {orderWebhookStatus && (
            <div className={`mt-4 p-3 rounded ${orderWebhookStatus.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
              <p className="font-medium">{orderWebhookStatus}</p>
              {orderWebhookDetails && <pre className="mt-2 text-sm whitespace-pre-wrap">{orderWebhookDetails}</pre>}
              {orderWebhookStatus.includes('successfully') && (
                <div className="mt-2 text-sm">
                  <p>Note: In development mode, webhooks may be simulated due to CORS restrictions.</p>
                  <p>The data has been sent using multiple methods to maximize chances of delivery.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Development Information</h2>
        <div className="space-y-2">
          <p><strong>User ID:</strong> {user?.id || 'Not logged in'}</p>
          <p><strong>Username:</strong> {user?.username || 'Not logged in'}</p>
          <p><strong>Email:</strong> {user?.email || 'Not available'}</p>
          <p><strong>Name:</strong> {user?.name || 'Not available'}</p>
          <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
        </div>
      </div>
    </div>
  );
};

export default DevelopersPage;
