import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, pass: string) => { success: boolean; message?: string };
  register: (data: { name: string; email: string; role: UserRole; phone: string; password: string }) => { success: boolean; message?: string };
  logout: () => void;
  hasPermission: (module: string, action?: 'read' | 'write' | 'delete' | 'admin') => boolean;
  usersList: User[];
  addUser: (data: { name: string; email: string; role: UserRole; phone: string; password: string }) => { success: boolean; message?: string };
  deleteUser: (id: string) => void;
  toggleUserActive: (id: string) => void;
}

const STORAGE_KEY_USER = 'dhanvantari_auth_user';
const STORAGE_KEY_ALL_USERS = 'dhanvantari_users';

const initialDefaultUsers: User[] = [
  { 
    id: 'usr-admin-1', 
    name: 'Admin User', 
    email: 'admin@dhanvantari.com', 
    password: 'admin', 
    role: 'Admin', 
    phone: '9876543210', 
    active: true, 
    createdAt: new Date().toISOString() 
  },
  { 
    id: 'usr-pharm-1', 
    name: 'Registered Pharmacist', 
    email: 'pharmacist@dhanvantari.com', 
    password: 'pharmacist', 
    role: 'Pharmacist', 
    phone: '9876543211', 
    active: true, 
    createdAt: new Date().toISOString() 
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usersList, setUsersList] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ALL_USERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse users from storage:', e);
    }
    return initialDefaultUsers;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse current user from storage:', e);
    }
    return null;
  });

  // Sync usersList to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ALL_USERS, JSON.stringify(usersList));
    } catch (e) {
      console.error('Failed to save users list:', e);
    }
  }, [usersList]);

  // Sync currentUser to localStorage whenever updated
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY_USER);
      }
    } catch (e) {
      console.error('Failed to save current user:', e);
    }
  }, [currentUser]);

  const login = (emailInput: string, passwordInput: string): { success: boolean; message?: string } => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, message: 'Please provide both email/username and password.' };
    }

    const matchedUser = usersList.find(
      u => (u.email.toLowerCase() === cleanEmail || u.name.toLowerCase() === cleanEmail) && 
           (u.password === cleanPass || (!u.password && cleanPass === 'admin'))
    );

    if (!matchedUser) {
      return { success: false, message: 'Invalid credentials. Please check your email and password.' };
    }

    if (!matchedUser.active) {
      return { success: false, message: 'This account has been deactivated. Contact system administrator.' };
    }

    setCurrentUser(matchedUser);
    return { success: true };
  };

  const register = (data: { name: string; email: string; role: UserRole; phone: string; password: string }): { success: boolean; message?: string } => {
    const cleanEmail = data.email.trim().toLowerCase();
    if (!cleanEmail || !data.password || !data.name.trim()) {
      return { success: false, message: 'Name, Email, and Password are required.' };
    }

    const existing = usersList.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, message: 'An account with this email address already exists.' };
    }

    const newUser: User = {
      id: 'usr-' + Date.now(),
      name: data.name.trim(),
      email: cleanEmail,
      role: data.role || 'Pharmacist',
      phone: data.phone?.trim() || '',
      password: data.password.trim(),
      active: true,
      createdAt: new Date().toISOString()
    };

    setUsersList(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    return { success: true };
  };

  const addUser = (data: { name: string; email: string; role: UserRole; phone: string; password: string }): { success: boolean; message?: string } => {
    const cleanEmail = data.email.trim().toLowerCase();
    if (!cleanEmail || !data.password || !data.name.trim()) {
      return { success: false, message: 'Name, Email, and Password are required.' };
    }

    const existing = usersList.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, message: 'An account with this email address already exists.' };
    }

    const newUser: User = {
      id: 'usr-' + Date.now(),
      name: data.name.trim(),
      email: cleanEmail,
      role: data.role || 'Pharmacist',
      phone: data.phone?.trim() || '',
      password: data.password.trim(),
      active: true,
      createdAt: new Date().toISOString()
    };

    setUsersList(prev => [...prev, newUser]);
    return { success: true };
  };

  const deleteUser = (id: string) => {
    setUsersList(prev => prev.filter(u => u.id !== id));
    if (currentUser?.id === id) {
      setCurrentUser(null);
    }
  };

  const toggleUserActive = (id: string) => {
    setUsersList(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u));
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const hasPermission = (module: string, action: 'read' | 'write' | 'delete' | 'admin' = 'read'): boolean => {
    if (!currentUser) return false;
    const role = currentUser.role;
    if (role === 'Owner' || role === 'Admin') return true;

    if (role === 'Pharmacist') {
      if (module === 'Security' || module === 'System Settings') return action === 'read';
      return true;
    }

    if (role === 'Cashier') {
      if (module === 'Billing' || module === 'Customers') return true;
      if (module === 'Medicines' || module === 'Dashboard') return action === 'read';
      return false;
    }

    if (role === 'Inventory Manager') {
      if (module === 'Medicines' || module === 'Batches' || module === 'Purchases' || module === 'Suppliers' || module === 'Expiry') return true;
      if (module === 'Dashboard') return action === 'read';
      return false;
    }

    if (role === 'Viewer') {
      return action === 'read';
    }

    return false;
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      login, 
      register, 
      logout, 
      hasPermission,
      usersList,
      addUser,
      deleteUser,
      toggleUserActive
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
