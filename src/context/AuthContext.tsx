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

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Track login attempt
      try {
        if (window.gtag) {
          window.gtag('event', 'login_attempt', {
            method: 'traditional',
            timestamp: new Date().toISOString()
          });
        }
      } catch (e) {
        console.error('Analytics error:', e);
      }
      
      // Check for staff credentials first
      const staffCredentials: Record<string, { password: string, role: string, name: string }> = {
        'DRIVER123': { password: 'driver123', role: 'driver', name: 'John Driver' },
        'DRIVER456': { password: 'driver456', role: 'driver', name: 'Sarah Driver' },
        'OWNER789': { password: 'owner789', role: 'owner', name: 'Owner Admin' },
        'ADMIN123': { password: 'admin123', role: 'admin', name: 'System Admin' }
      };
      
      if (staffCredentials[username] && staffCredentials[username].password === password) {
        const userData: User = {
          id: `staff-${Date.now()}`,
          username: username,
          name: staffCredentials[username].name,
          role: staffCredentials[username].role
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Track successful login
        try {
          if (window.gtag) {
            window.gtag('event', 'login_success', {
              method: 'traditional',
              user_type: 'staff',
              user_role: userData.role,
              timestamp: new Date().toISOString()
            });
          }
        } catch (e) {
          console.error('Analytics error:', e);
        }
        
        return true;
      }
      
      // Check for regular user credentials
      if (username === 'demo' && password === 'password') {
        const userData: User = {
          id: '1',
          username: 'demo',
          name: 'Demo User',
          email: 'demo@example.com',
          role: 'customer'
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Track successful login
        try {
          if (window.gtag) {
            window.gtag('event', 'login_success', {
              method: 'traditional',
              user_type: 'customer',
              timestamp: new Date().toISOString()
            });
          }
        } catch (e) {
          console.error('Analytics error:', e);
        }
        
        return true;
      }
      
      // Check for registered users in localStorage
      const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const foundUser = users.find((u: any) => 
        u.username === username && u.password === password
      );
      
      if (foundUser) {
        const userData: User = {
          id: foundUser.id,
          username: foundUser.username,
          name: foundUser.name,
          email: foundUser.email,
          role: 'customer'
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Track successful login
        try {
          if (window.gtag) {
            window.gtag('event', 'login_success', {
              method: 'traditional',
              user_type: 'customer',
              timestamp: new Date().toISOString()
            });
          }
        } catch (e) {
          console.error('Analytics error:', e);
        }
        
        return true;
      }
      
      // Track failed login
      try {
        if (window.gtag) {
          window.gtag('event', 'login_failure', {
            method: 'traditional',
            reason: 'invalid_credentials',
            timestamp: new Date().toISOString()
          });
        }
      } catch (e) {
        console.error('Analytics error:', e);
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      
      // Track error
      try {
        if (window.gtag) {
          window.gtag('event', 'login_error', {
            method: 'traditional',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          });
        }
      } catch (e) {
        console.error('Analytics error:', e);
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (accessToken: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Get user info from Google
      const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      const googleUserInfo: GoogleUserInfo = response.data;
      
      // Check if user already exists in our system
      const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      let existingUser = users.find((u: any) => 
        u.email === googleUserInfo.email || u.googleId === googleUserInfo.sub
      );
      
      let userData: User;
      
      if (existingUser) {
        // Update existing user with Google info if needed
        if (!existingUser.googleId) {
          existingUser.googleId = googleUserInfo.sub;
          existingUser.picture = googleUserInfo.picture;
          
          // Update in localStorage
          localStorage.setItem('registeredUsers', JSON.stringify(users));
        }
        
        userData = {
          id: existingUser.id,
          username: existingUser.username || googleUserInfo.email.split('@')[0],
          name: existingUser.name || googleUserInfo.name,
          email: googleUserInfo.email,
          role: 'customer',
          picture: googleUserInfo.picture,
          googleId: googleUserInfo.sub
        };
      } else {
        // Create new user
        const newUser = {
          id: Date.now().toString(),
          username: googleUserInfo.email.split('@')[0],
          email: googleUserInfo.email,
          name: googleUserInfo.name,
          googleId: googleUserInfo.sub,
          picture: googleUserInfo.picture,
          role: 'customer'
        };
        
        // Save to "database"
        users.push(newUser);
        localStorage.setItem('registeredUsers', JSON.stringify(users));
        
        userData = {
          id: newUser.id,
          username: newUser.username,
          name: newUser.name,
          email: newUser.email,
          role: 'customer',
          picture: newUser.picture,
          googleId: newUser.googleId
        };
        
        // Send webhook for new user registration
        try {
          await webhookService.sendUserRegistrationWebhook({
            event: "new_customer_signup",
            customer_id: userData.id,
            name: userData.name || "",
            email: userData.email || "",
            username: userData.username,
            registration_date: new Date().toISOString(),
            location: "Thailand", // Default location
            phone: "+66123456789", // Default phone format for Thailand
            signup_method: "google"
          });
          console.log("Welcome email webhook triggered successfully");
        } catch (webhookError) {
          console.error("Failed to trigger welcome email webhook:", webhookError);
          // Continue with signup process even if webhook fails
        }
      }
      
      // Set user in context and localStorage
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Store token securely (in a real app, you'd use HttpOnly cookies)
      // For demo purposes, we'll store in localStorage with expiration
      const tokenExpiry = new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 1); // 1 hour expiry
      
      localStorage.setItem('google_token', JSON.stringify({
        token: accessToken,
        expiry: tokenExpiry.toISOString()
      }));
      
      // Track successful login
      try {
        if (window.gtag) {
          window.gtag('event', 'login_success', {
            method: 'google',
            user_type: 'customer',
            is_new_user: !existingUser,
            timestamp: new Date().toISOString()
          });
        }
      } catch (e) {
        console.error('Analytics error:', e);
      }
      
      return true;
    } catch (error) {
      console.error('Google login error:', error);
      
      // Track error
      try {
        if (window.gtag) {
          window.gtag('event', 'login_error', {
            method: 'google',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          });
        }
      } catch (e) {
        console.error('Analytics error:', e);
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    username: string, 
    email: string, 
    password: string, 
    name: string
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Track signup attempt
      try {
        if (window.gtag) {
          window.gtag('event', 'signup_attempt', {
            method: 'traditional',
            timestamp: new Date().toISOString()
          });
        }
      } catch (e) {
        console.error('Analytics error:', e);
      }
      
      // Check if username already exists
      const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      if (users.some((u: any) => u.username === username)) {
        // Track failure
        try {
          if (window.gtag) {
            window.gtag('event', 'signup_failure', {
              method: 'traditional',
              reason: 'username_exists',
              timestamp: new Date().toISOString()
            });
          }
        } catch (e) {
          console.error('Analytics error:', e);
        }
        
        return false;
      }
      
      // Create new user
      const newUser = {
        id: Date.now().toString(),
        username,
        email,
        password, // In a real app, this should be hashed
        name,
        role: 'customer'
      };
      
      // Save to "database"
      users.push(newUser);
      localStorage.setItem('registeredUsers', JSON.stringify(users));
      
      // Log user in
      const userData: User = {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        role: 'customer'
      };
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Send webhook for new user registration using the specialized method
      try {
        await webhookService.sendUserRegistrationWebhook({
          event: "new_customer_signup",
          customer_id: userData.id,
          name: userData.name || "",
          email: userData.email || "",
          username: userData.username,
          registration_date: new Date().toISOString(),
          location: "Thailand", // Default location
          phone: "+66123456789", // Default phone format for Thailand
          signup_method: "traditional"
        });
        console.log("Welcome email webhook triggered successfully");
      } catch (webhookError) {
        console.error("Failed to trigger welcome email webhook:", webhookError);
        // Continue with signup process even if webhook fails
      }
      
      // Track successful signup
      try {
        if (window.gtag) {
          window.gtag('event', 'signup_success', {
            method: 'traditional',
            timestamp: new Date().toISOString()
          });
        }
      } catch (e) {
        console.error('Analytics error:', e);
      }
      
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      
      // Track error
      try {
        if (window.gtag) {
          window.gtag('event', 'signup_error', {
            method: 'traditional',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          });
        }
      } catch (e) {
        console.error('Analytics error:', e);
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Track logout
    try {
      if (window.gtag && user) {
        window.gtag('event', 'logout', {
          user_type: user.role,
          timestamp: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error('Analytics error:', e);
    }
    
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('google_token');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      signup, 
      logout,
      isLoading,
      loginWithGoogle
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
