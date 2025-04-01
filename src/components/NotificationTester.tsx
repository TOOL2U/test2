import React, { useState } from 'react';
import { useOrders } from '../context/OrderContext';

/**
 * Component for testing the notification system
 */
export default function NotificationTester() {
  const { sendTestNotification } = useOrders();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

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
      const response = await sendTestNotification(email);
      
      setResult({
        success: true,
        message: 'Test notification sent successfully! Check your email inbox.'
      });
      
      console.log('Test notification response:', response);
    } catch (error) {
      console.error('Error sending test notification:', error);
      
      setResult({
        success: false,
        message: 'Failed to send test notification. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Test Delivery Notification</h2>
      
      <p className="text-gray-600 mb-4">
        Send a test notification to verify the delivery notification system is working correctly.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-[#FFD700] text-gray-900 py-2 rounded-lg font-bold hover:bg-[#FFE44D] transition-colors ${
            isLoading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </span>
          ) : (
            'Send Test Notification'
          )}
        </button>
      </form>
      
      {result && (
        <div className={`mt-4 p-4 rounded-lg ${
          result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {result.message}
        </div>
      )}
      
      <div className="mt-6 border-t pt-4">
        <h3 className="font-medium mb-2">How It Works</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
          <li>Enter your email address to receive a test notification</li>
          <li>The system will simulate a driver approaching your location</li>
          <li>A webhook request is sent to Make.com</li>
          <li>Make.com processes the request and sends an email notification</li>
          <li>Check your inbox for the test notification email</li>
        </ol>
      </div>
    </div>
  );
}
