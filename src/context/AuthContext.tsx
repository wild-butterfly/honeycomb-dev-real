// AuthContext.tsx
// User authentication context

import React, { createContext, useContext, useEffect, useState } from "react";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  full_name?: string;
  phone?: string;
  job_title?: string;
  department?: string;
  address?: string;
  timezone?: string;
  language?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedEmail = localStorage.getItem("email");

    if (storedUser) {
      try {
        setUserState(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from storage", e);
      }
    } else if (storedEmail) {
      // Create minimal user object from email if available
      const userName = storedEmail.split("@")[0];
      setUserState({
        id: 0,
        name: userName,
        email: storedEmail,
        role: "user",
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${storedEmail}`,
      });
    }

    setLoading(false);
  }, []);

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem("user", JSON.stringify(newUser));
      localStorage.setItem("email", newUser.email);
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("email");
    }
  };

  const logout = () => {
    setUserState(null);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
