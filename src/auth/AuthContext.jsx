import { createContext, useContext, useState, useCallback } from 'react';
import bcrypt from 'bcryptjs';

const AuthContext = createContext(null);

const USERS_KEY = 'helios-auth-users';
const SESSION_KEY = 'helios-session';

function generateToken() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now();
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const session = getSession();
    if (!session) return null;
    const users = getUsers();
    return users.find((u) => u.username === session.username) || null;
  });

  const register = useCallback(async (username, password) => {
    const users = getUsers();
    if (users.find((u) => u.username === username)) {
      throw new Error('Username already taken');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = { username, passwordHash, createdAt: new Date().toISOString() };
    saveUsers([...users, newUser]);

    const token = generateToken();
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username, token }));
    setUser(newUser);
    return newUser;
  }, []);

  const login = useCallback(async (username, password) => {
    const users = getUsers();
    const found = users.find((u) => u.username === username);
    if (!found) throw new Error('User not found');
    const valid = await bcrypt.compare(password, found.passwordHash);
    if (!valid) throw new Error('Invalid password');

    const token = generateToken();
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username, token }));
    setUser(found);
    return found;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
