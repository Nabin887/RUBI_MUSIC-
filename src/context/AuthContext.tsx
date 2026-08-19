
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: any, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Always initialize with a Guest user to bypass login
  const [user] = useState<User>({
      id: 'guest',
      name: 'Guest',
      email: 'guest@nabify.app'
  });

  return (
    <AuthContext.Provider value={{ 
        user, 
        loading: false, 
        login: () => {}, 
        logout: () => {}, 
        isAuthenticated: true 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
