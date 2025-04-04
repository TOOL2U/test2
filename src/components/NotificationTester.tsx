import React, { useState } from 'react';
import { useOrders } from '../context/OrderContext';
import { AlertCircle, CheckCircle, Send } from 'lucide-react';

const NotificationTester: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [notificationType, setNotificationType] = useState<'proximity' | 'onourway'>('proximity');
  
  const { sendTestNotification, sendTestOnOurWayNotification } = useOrders();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setResult({
        success: false,
        message: 'Please enter an email address'
      });
      return;
    }
    
    setIsLoading(true);
    setResult(null);
    
    try {
      let response;
      
      if (notificationType === 'proximity') {
        // Send proximity notification (driver is 1km away)
        response = await sendTestNotification(email);
      } else {
        // Send "on our way" notification
        response = await sendTestOnOurWayNotification(email);
      }
      
      setResult({
        success: true,
        message: `Test ${notificationType === 'proximity' ? 'proximity' : '"On Our Way"'} notification sent to ${email}`
      });
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send notification'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold mb-4">Test Notification System</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="notification-type" className="block text-sm font-medium text-gray-700 mb-1">
            Notification Type
          </label>
          <select
            id="notification-type"
            value={notificationType}
            onChange={(e) => setNotificationType(e.target.value as 'proximity' | 'onourway')}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="proximity">Proximity Notification (Driver is 1km away)</option>
            <option value="onourway">On Our Way Notification</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email to receive test notification"
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Test Notification
            </>
          )}
        </button>
      </form>
      
      {result && (
        <div className={`mt-4 p-3 rounded-md ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400" />
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                {result.message}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        <p>This will send a test notification to the provided email address.</p>
        <p className="mt-1">
          <strong>Proximity Notification:</strong> Simulates when a driver is 1km away from delivery location.
        </p>
        <p className="mt-1">
          <strong>On Our Way Notification:</strong> Simulates when an order status changes to "on our way".
        </p>
      </div>
    </div>
  );
};

export default NotificationTester;
