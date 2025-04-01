import React, { useState } from 'react';
import { useOrders } from '../context/OrderContext';
import { AlertTriangle, CheckCircle, Send } from 'lucide-react';

const NotificationTester: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const { sendTestNotification } = useOrders();

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
        success: response.success,
        message: response.message || 'Test notification sent successfully'
      });
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-bold mb-4">Test Notification System</h3>
      
      <p className="text-gray-600 text-sm mb-4">
        Send a test notification to verify the webhook integration with Make.com. 
        This will simulate both the "driver approaching" and "order delivered" notifications.
      </p>
      
      {result && (
        <div className={`p-4 mb-4 rounded-lg ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-400" />
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
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            placeholder="Enter email to receive test notification"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-[#FFD700] text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-[#FFE44D] transition-colors flex items-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
          
          <button
            type="button"
            className="text-gray-600 hover:text-gray-900"
            onClick={() => {
              setEmail('');
              setResult(null);
            }}
          >
            Reset
          </button>
        </div>
      </form>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="font-medium text-sm mb-2">Webhook Information</h4>
        <p className="text-xs text-gray-600">
          The test notification will be sent to Make.com using the webhook URL: 
          <code className="bg-gray-100 px-1 py-0.5 rounded ml-1 text-xs">
            https://hook.eu2.make.com/51kxwhrvgtagkojqethkwq5pdv2sttn0
          </code>
        </p>
      </div>
    </div>
  );
};

export default NotificationTester;
