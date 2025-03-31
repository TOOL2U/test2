import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import { User, Mail, Lock, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [signupError, setSignupError] = useState('');

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
    
    // Clear general signup error when user makes changes
    if (signupError) {
      setSignupError('');
    }
  };

  const validateForm = (): boolean => {
    const newErrors = {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      name: ''
    };
    let isValid = true;

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    // Validate username
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
      isValid = false;
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
      isValid = false;
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    // Validate confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
    setSignupError('');
    
    try {
      const success = await signup(
        formData.username,
        formData.email,
        formData.password,
        formData.name
      );
      
      if (success) {
        // Redirect to home page after successful signup
        navigate('/');
      } else {
        setSignupError('Username already exists. Please choose another one.');
      }
    } catch (error) {
      setSignupError('An error occurred. Please try again.');
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 flex flex-col bg-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex-grow flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden max-w-md w-full p-8 transition-all duration-300 hover:shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FFD700]/20 mb-4">
              <UserPlus className="h-8 w-8 text-[#FFD700]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Create an Account</h1>
            <p className="text-gray-600 mt-2">Join Tool2u and start renting tools</p>
          </div>
          
          {signupError && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
              <p>{signupError}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full Name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              fullWidth
              startIcon={<User size={18} />}
              autoComplete="name"
            />
            
            <Input
              label="Username"
              name="username"
              type="text"
              placeholder="Choose a username"
              value={formData.username}
              onChange={handleChange}
              error={errors.username}
              fullWidth
              startIcon={<User size={18} />}
              autoComplete="username"
            />
            
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              fullWidth
              startIcon={<Mail size={18} />}
              autoComplete="email"
            />
            
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              fullWidth
              startIcon={<Lock size={18} />}
              autoComplete="new-password"
            />
            
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              fullWidth
              startIcon={<Lock size={18} />}
              autoComplete="new-password"
            />
            
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={isLoading}
              className="py-3 mt-6"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-[#FFD700] hover:text-[#FFD700]/80">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
