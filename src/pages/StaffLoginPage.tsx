import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, AlertTriangle, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const StaffLoginPage: React.FC = () => {
  const [staffCode, setStaffCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, login } = useAuth();

  // If already logged in, redirect to staff dashboard
  useEffect(() => {
    if (user) {
      // Check if user has staff role
      const staffRoles = ['staff', 'admin', 'driver', 'owner'];
      const isStaff = user.role && staffRoles.includes(user.role);
      
      if (isStaff) {
        navigate('/staff-dashboard');
      }
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Check for staff credentials in localStorage
      const storedStaffUsers = JSON.parse(localStorage.getItem('staffUsers') || '[]');
      const foundStaffUser = storedStaffUsers.find((user: any) => 
        user.username === staffCode && user.password === password
      );

      if (foundStaffUser) {
        // Use the auth context login method
        const success = await login(staffCode, password);
        
        if (success) {
          console.log(`Staff authenticated: ${foundStaffUser.name} (${foundStaffUser.role})`);
          navigate('/staff-dashboard');
        } else {
          setError('Authentication failed. Please try again.');
        }
      } else {
        setError('Invalid staff code or password. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-20">
      <div className="container mx-auto px-6 py-8">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto">
          <div className="flex justify-center mb-6">
            <Lock className="w-16 h-16 text-gray-700" />
          </div>
          <h2 className="text-2xl font-semibold mb-4 text-center">Staff Login</h2>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <p className="text-gray-600 mb-6 text-center">
            This area is restricted to authorized staff members only. Please enter your credentials to access the staff dashboard.
          </p>
          
          <form 
            className="space-y-4"
            onSubmit={handleLogin}
          >
            <div>
              <label htmlFor="staffCode" className="block text-sm font-medium text-gray-700 mb-1">
                Staff Code
              </label>
              <input
                type="text"
                id="staffCode"
                name="staffCode"
                placeholder="Enter your staff code"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                value={staffCode}
                onChange={(e) => setStaffCode(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                For demo: Use DRIVER123, DRIVER456, OWNER789, or ADMIN123
              </p>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter your password"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                For demo: Use lowercase staff code as password (e.g., driver123)
              </p>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#FFD700] text-gray-900 py-2 rounded-lg font-bold hover:bg-[#FFE44D] transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                <span className="flex items-center">
                  <LogIn className="w-4 h-4 mr-2" />
                  Access Dashboard
                </span>
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffLoginPage;
