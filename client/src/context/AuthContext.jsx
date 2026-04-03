import { createContext, useContext, useEffect, useState } from "react";
import api, { tokenStorageKey } from "../api/http.js";

const AuthContext = createContext(null);

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong.";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(tokenStorageKey);
    if (!token) {
      setLoading(false);
      return;
    }

    const bootstrap = async () => {
      try {
        const response = await api.get("/auth/me");
        setUser(response.data.user);
      } catch (_error) {
        localStorage.removeItem(tokenStorageKey);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = async (payload) => {
    const response = await api.post("/auth/login", payload);
    localStorage.setItem(tokenStorageKey, response.data.token);
    setUser(response.data.user);
    return response.data.user;
  };

  const signup = async (payload) => {
    const response = await api.post("/auth/signup", payload);
    localStorage.setItem(tokenStorageKey, response.data.token);
    setUser(response.data.user);
    return response.data.user;
  };

  const logout = () => {
    localStorage.removeItem(tokenStorageKey);
    setUser(null);
  };

  const updateProfile = async (payload) => {
    const response = await api.patch("/auth/profile", payload);
    setUser(response.data.user);
    return response.data.user;
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    updateProfile,
    getErrorMessage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
