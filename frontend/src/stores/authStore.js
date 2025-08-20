import { createContext, useContext, useState } from 'react';

export const AuthContext = createContext();

// Default user object
const defaultUser = {
  photo: '/assets/images/default-profile.png',
  rank: 'N/A',
  surname: 'Guest',
  tier: 0,
  force_number: '00000',
  email: ''
};

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      // Replace with actual API call
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (process.env.NODE_ENV === 'development' || 
              email === 'demo@example.com' && password === 'password') {
            
            // Mock user data - replace with actual API response
            const mockUser = {
              ...defaultUser,
              email,
              surname: 'Demo-User',
              rank: 'Sergeant',
              tier: 1,
              force_number: '12345',
              photo: null
            };
            
            setUser(mockUser);
            setIsLoading(false);
            resolve(mockUser);
          } else {
            setIsLoading(false);
            reject(new Error('Invalid credentials'));
          }
        }, 1000);
      });
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
  };

  const value = {
    user: user || defaultUser, // Fallback to default if null
    isLoading,
    isAuthenticated: !!user,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}