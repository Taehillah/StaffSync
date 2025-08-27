// src/stores/authStore.js
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthCtx = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("staffsync:user")) || null; }
    catch { return null; }
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) localStorage.setItem("staffsync:user", JSON.stringify(user));
    else localStorage.removeItem("staffsync:user");
  }, [user]);

  const login = async (email, password) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 400));
    if (!email || !password) throw new Error("Email and password required");
    setUser({ id: "demo-user", rank: "Sergeant", surname: "DEMO-USER", tier: 1, email });
    setIsLoading(false);
  };

  // called by RegisterForm.jsx
  const register = async (profile) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 600));
    // Persist the just-registered user; mirror fields your UI shows
    setUser({
      id: profile.forceNumber || "demo-user",
      rank: profile.rank || "Member",
      surname: profile.surname || "User",
      tier: 1,
      email: profile.email || "",
    });
    setIsLoading(false);
  };

  const logout = () => setUser(null);

  // ...
const value = {
  user,
  isAuthenticated: !!user,   // <— REQUIRED for the guard
  isLoading,
  login,
  register,
  logout,
};


  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
};

export const useAuth = () => useContext(AuthCtx);
