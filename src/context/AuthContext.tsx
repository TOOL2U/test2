import React, { createContext, useContext, useState, useEffect } from 'react';
import { webhookService } from '../utils/webhookService';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  email?: string;
  name?: string;
  role?: string;
  picture?: string;
  googleId?: string;
}

interface GoogleUserInfo {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (username: string, email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  loginWithGoogle: (accessToken: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing user session on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Initialize staff users in localStorage
  useEffect(() => {
    // Only the three specified accounts will be available
    const staffUsers = [
      { id: 'ADMIN123', username: 'ADMIN123', password: 'admin123', role: 'admin', name: 'Shaun' },
      { id: 'MANAGER123', username: 'MANAGER123', password: 'manager123', role: 'admin', name: 'Manager' },
      { id: 'DRIVER123', username: 'DRIVER123', password: 'driver123', role: 'staff', name: 'Driver' }
    ];
    localStorage.setItem('staffUsers', JSON.stringify(staffUsers));
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Predefined staff credentials
      const staffCredentials = {
        'ADMIN123': { password: 'admin123', role: 'admin', name: 'Shaun' },
        'MANAGER123': { password: 'manager123', role: 'admin', name: 'Manager' },
        'DRIVER123': { password: 'driver123', role: 'staff', name: 'Driver' }
      };

      // Check if username exists in staff credentials
      const foundUser = staffCredentials[username];
      if (foundUser && foundUser.password === password) {
        const userData: User = {
          id: username,
          username,
          name: foundUser.name,
          role: foundUser.role,
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username: string, email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // For this implementation, we're not allowing new signups
      // as we're using only the predefined accounts
      return false;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const loginWithGoogle = async (accessToken: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await axios.get<GoogleUserInfo>(
        `https://www.googleapis.com/oauth2/v3/userinfo`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const googleUser = response.data;
      const userData: User = {
        id: googleUser.sub,
        username: googleUser.email,
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        googleId: googleUser.sub,
        role: 'customer',
      };

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Google login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, signup, logout, isLoading, loginWithGoogle }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
