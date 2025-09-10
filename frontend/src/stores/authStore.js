// src/stores/authStore.js
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthCtx = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("staffsync:user")) || null; }
    catch { return null; }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [pendingProfileChange, setPendingProfileChange] = useState(() => {
    try { return JSON.parse(localStorage.getItem("staffsync:pendingProfileChange")) || null; }
    catch { return null; }
  });

  useEffect(() => {
    if (user) localStorage.setItem("staffsync:user", JSON.stringify(user));
    else localStorage.removeItem("staffsync:user");
  }, [user]);

  useEffect(() => {
    if (pendingProfileChange) localStorage.setItem("staffsync:pendingProfileChange", JSON.stringify(pendingProfileChange));
    else localStorage.removeItem("staffsync:pendingProfileChange");
  }, [pendingProfileChange]);

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

  const updateProfile = async (updates) => {
    // Simulate server latency
    await new Promise(r => setTimeout(r, 200));
    setUser(prev => ({ ...prev, ...updates }));
  };

  // Submit a profile change request to be approved by Tier 1/2 and finalized by Tier 3
  const submitProfileChange = async (updates) => {
    await new Promise(r => setTimeout(r, 150));
    setPendingProfileChange({
      updates,
      submittedBy: user?.email || user?.id || "unknown",
      submittedAt: Date.now(),
      status: "pending", // pending -> recommended -> approved/rejected
    });
  };

  // Tier 1/2 recommendation
  const recommendProfileChange = async (recommend = true) => {
    if (!pendingProfileChange) return;
    await new Promise(r => setTimeout(r, 120));
    setPendingProfileChange(prev => ({
      ...prev,
      status: recommend ? "recommended" : "rejected",
      recommendedBy: user?.email || user?.id || "unknown",
      recommendedAt: Date.now(),
    }));
  };

  // Tier 3 final approval
  const finalizeProfileChange = async (approve = true) => {
    if (!pendingProfileChange) return;
    await new Promise(r => setTimeout(r, 120));
    if (approve) {
      setUser(prev => ({ ...prev, ...pendingProfileChange.updates }));
    }
    setPendingProfileChange(null);
  };

  // ...
const value = {
  user,
  isAuthenticated: !!user,   // <— REQUIRED for the guard
  isLoading,
  login,
  register,
  logout,
  updateProfile,
  pendingProfileChange,
  submitProfileChange,
  recommendProfileChange,
  finalizeProfileChange,
};


  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
};

export const useAuth = () => useContext(AuthCtx);
