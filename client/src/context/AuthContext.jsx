import { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

const STORAGE_KEY = 'guitar_app_auth';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { user: null, token: null };
  } catch {
    return { user: null, token: null };
  }
}

export const AuthProvider = ({ children }) => {
  const stored = loadFromStorage();
  const [user, setUser] = useState(stored.user);
  const [token, setToken] = useState(stored.token);

  const login = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: userData, token: tokenData }));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);