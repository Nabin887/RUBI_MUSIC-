
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { api, setAuthToken } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface StoredUser extends User {
  password: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const USERS_KEY = 'ruby_users_db';
const SESSION_KEY = 'ruby_current_user';

const readUsers = (): StoredUser[] => {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]') as StoredUser[];
  } catch {
    return [];
  }
};

const writeUsers = (users: StoredUser[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const persistSession = (nextUser: User | null) => {
  if (nextUser) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
};

const readSession = (): User | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const withTimeout = async <T,>(promise: Promise<T>, ms = 4500): Promise<T> => {
      return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout')), ms);
        promise
          .then((value) => {
            clearTimeout(timer);
            resolve(value);
          })
          .catch((err) => {
            clearTimeout(timer);
            reject(err);
          });
      });
    };

    const bootstrap = async () => {
      try {
        const refreshed = await withTimeout(api.get('/auth/refresh'));
        const token = refreshed?.data?.accessToken as string | undefined;
        if (token) setAuthToken(token);

        const me = await withTimeout(api.get('/auth/me'));
        const meUser = me?.data?.user;
        if (meUser) {
          const loggedInUser: User = {
            id: meUser.id,
            name: meUser.name,
            email: meUser.email,
            avatar: meUser.avatar,
          };
          if (!cancelled) {
            setUser(loggedInUser);
            persistSession(loggedInUser);
          }
        }
      } catch {
        setAuthToken(null);
        if (!cancelled) {
          setUser(readSession());
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void bootstrap();

    // Hard fallback: never keep blank loading screen forever.
    const forceFinish = setTimeout(() => {
      if (!cancelled) {
        setUser((prev) => prev ?? readSession());
        setLoading(false);
      }
    }, 5500);

    return () => {
      cancelled = true;
      clearTimeout(forceFinish);
    };
  }, []);

  const signup = async (name: string, email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

    if (!cleanName || !normalizedEmail || !password) {
      return { success: false, message: 'Please fill all fields.' };
    }
    if (!isEmailValid) {
      return { success: false, message: 'Please enter a valid email address.' };
    }
    if (password.length < 8) {
      return { success: false, message: 'Password should be at least 8 characters.' };
    }

    try {
      const res = await api.post('/auth/signup', {
        name: cleanName,
        email: normalizedEmail,
        password,
      });
      const data = res.data;
      if (data?.accessToken) setAuthToken(data.accessToken);
      if (data?.user) {
        const loggedInUser: User = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          avatar: data.user.avatar,
        };
        setUser(loggedInUser);
        persistSession(loggedInUser);
      }
      return { success: true };
    } catch (error: any) {
      if (error?.response?.data?.message) {
        return { success: false, message: error.response.data.message };
      }

      const users = readUsers();
      const exists = users.some((u) => u.email === normalizedEmail);
      if (exists) {
        return { success: false, message: 'Account already exists. Please log in.' };
      }

      const localUser: StoredUser = {
        id: `usr_${Date.now()}`,
        name: cleanName,
        email: normalizedEmail,
        password,
        avatar: '',
      };
      writeUsers([...users, localUser]);

      const loggedInUser: User = {
        id: localUser.id,
        name: localUser.name,
        email: localUser.email,
        avatar: localUser.avatar,
      };
      setUser(loggedInUser);
      persistSession(loggedInUser);

      return {
        success: true,
        message: 'Created account in local fallback mode (backend unavailable).',
      };
    }
  };

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

    if (!isEmailValid) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    try {
      const res = await api.post('/auth/login', {
        email: normalizedEmail,
        password,
      });
      const data = res.data;
      if (data?.accessToken) setAuthToken(data.accessToken);
      if (data?.user) {
        const loggedInUser: User = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          avatar: data.user.avatar,
        };
        setUser(loggedInUser);
        persistSession(loggedInUser);
      }
      return { success: true };
    } catch (error: any) {
      if (error?.response?.data?.message) {
        return { success: false, message: error.response.data.message };
      }

      const users = readUsers();
      const localMatch = users.find((u) => u.email === normalizedEmail && u.password === password);
      if (!localMatch) {
        return { success: false, message: 'Backend unavailable and no local account found.' };
      }

      const loggedInUser: User = {
        id: localMatch.id,
        name: localMatch.name,
        email: localMatch.email,
        avatar: localMatch.avatar,
      };
      setUser(loggedInUser);
      persistSession(loggedInUser);
      return { success: true };
    }
  };

  const logout = async () => {
    // Clear client state first so logout feels instant even if backend is down.
    setAuthToken(null);
    setUser(null);
    persistSession(null);

    try {
      await api.post('/auth/logout');
    } catch {
      // Backend logout can fail/offline; local logout is already complete.
    }
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    try {
      const res = await api.patch('/auth/me', data);
      const updated = res?.data?.user;
      if (updated) {
        const nextUser: User = {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          avatar: updated.avatar,
        };
        setUser(nextUser);
        persistSession(nextUser);
        return;
      }
    } catch {
      // Fall through and keep optimistic update.
    }
    setUser((prev) => {
      if (!prev) return prev;
      const nextUser = { ...prev, ...data };
      persistSession(nextUser);

      const users = readUsers();
      const updatedUsers = users.map((u) => (u.id === prev.id ? { ...u, ...data } : u));
      writeUsers(updatedUsers);
      return nextUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        updateUser,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
