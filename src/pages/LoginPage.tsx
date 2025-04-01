import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import { User, Lock, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GoogleLoginButton from '../components/GoogleLoginButton';
import Modal from '../components/Modal'; // Assuming a Modal component exists

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading: authLoading } = useAuth();
  
  // Get the page user was trying to access
  const from = location.state?.from?.pathname || '/';
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    username: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [googleLoginError, setGoogleLoginError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track page view for analytics
  useEffect(() => {
    try {
      if (window.gtag) {
        window.gtag('event', 'page_view', {
          page_title: 'Login Page',
          page_location: window.location.href,
          page_path: location.pathname,
          send_to: 'login_page'
        });
      }
    } catch (e) {
      console.error('Analytics error:', e);
    }
  }, [location]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear general login error when user makes changes
    if (loginError) {
      setLoginError('');
    }
  };

  const validateForm = (): boolean => {
    const newErrors = {
      username: '',
      password: ''
    };
    let isValid = true;

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setLoginError('');
    
    try {
      const success = await login(formData.username, formData.password);
      
      if (success) {
        // Navigate to the page they were trying to access, or home
        navigate(from, { replace: true });
      } else {
        setLoginError('Invalid username or password');
      }
    } catch (error) {
      setLoginError('An error occurred. Please try again.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLoginStart = () => {
    setIsGoogleLoading(true);
    setGoogleLoginError('');
  };

  const handleGoogleLoginError = (error: Error) => {
    setGoogleLoginError(error.message || 'Google login failed. Please try again.');
    setIsGoogleLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }

    setIsSubmitting(true);
    setEmailError('');

    try {
      // Simulate sending a password reset link
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Password reset link sent to your email');
      setIsForgotPasswordOpen(false);
      setEmail('');
    } catch (error) {
      setEmailError('Failed to send password reset link. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // When Google login is successful, the redirect happens in the AuthContext

  return (
    <div
      className="h-screen w-screen bg-cover bg-center flex items-center justify-center"
      style={{
        backgroundImage: `url('https://i.imgur.com/wBQyjaK.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="bg-gray-900 bg-opacity-90 p-8 rounded-lg shadow-md max-w-md w-full text-white">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FFD700]/20 mb-4">
            <LogIn className="h-8 w-8 text-[#FFD700]" />
          </div>
          <h1 className="text-2xl font-bold text-[#FFD700]">Welcome Back</h1>
          <p className="text-gray-300 mt-2">Sign in to your Tool2u account</p>
        </div>
        
        {loginError && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
            <p>{loginError}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Username"
            name="username"
            type="text"
            placeholder="Enter your username"
            value={formData.username}
            onChange={handleChange}
            error={errors.username}
            fullWidth
            startIcon={<User size={18} />}
            autoComplete="username"
          />
          
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            fullWidth
            startIcon={<Lock size={18} />}
            autoComplete="current-password"
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-[#FFD700] focus:ring-[#FFD700] border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                Remember me
              </label>
            </div>
            
            <div className="text-sm text-right">
              <button
                onClick={() => setIsForgotPasswordOpen(true)}
                className="font-medium text-[#FFD700] hover:text-[#FFD700]/80"
              >
                Forgot password?
              </button>
            </div>
          </div>
          
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={isLoading || authLoading}
            className="py-3"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
          
          <div className="relative flex items-center justify-center mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative px-4 bg-gray-900">
              <span className="text-sm text-gray-500">Or continue with</span>
            </div>
          </div>
          
          <div className="mt-6">
            <GoogleLoginButton 
              onLoginStart={handleGoogleLoginStart}
              onLoginError={handleGoogleLoginError}
              className="py-3"
            />
            
            {googleLoginError && (
              <div className="mt-3 flex items-start gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>{googleLoginError}</p>
              </div>
            )}
            
            {isGoogleLoading && (
              <div className="mt-3 text-center text-sm text-gray-600">
                <p>Connecting to Google...</p>
              </div>
            )}
          </div>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-300">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium text-[#FFD700] hover:text-[#FFD700]/80">
              Create an account
            </Link>
          </p>
        </div>
      </div>

      {isForgotPasswordOpen && (
        <Modal onClose={() => setIsForgotPasswordOpen(false)}>
          <div className="p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-lg font-bold mb-4">Reset Password</h2>
            <p className="text-sm text-gray-600 mb-4">Enter your email address to receive a password reset link.</p>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-2"
            />
            {emailError && <p className="text-sm text-red-600 mb-2">{emailError}</p>}
            <button
              onClick={handleForgotPassword}
              disabled={isSubmitting}
              className="w-full bg-[#FFD700] text-gray-900 py-2 rounded font-bold hover:bg-[#FFE44D] transition"
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LoginPage;
