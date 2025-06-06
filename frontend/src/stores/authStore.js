import { createContext, useContext, useState } from 'react';

export const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = async (email, password) => {
    // Replace with actual API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if  (process.env.NODE_ENV === 'development' || /*remove the Or and everything before it leaving if*/email === 'demo@example.com' && password === 'password') {
          setIsAuthenticated(true);
          resolve();
        } else {
         reject(new Error('Invalid credentials'));

        // setIsAuthenticated(true); // Hloni remove after building dashboard
      //   resolve();// Hloni remove after building dashboard

        }
      }, 1000);
    });
  };

  const value = {
    isAuthenticated,
    login
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
