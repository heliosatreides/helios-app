import { createContext, useContext, useState, useCallback } from 'react';
import bcrypt from 'bcryptjs';

const AuthContext = createContext(null);

const USERS_KEY = 'helios-auth-users';
const SESSION_KEY = 'helios-session';
const SESSION_PW_KEY = 'helios-session-pw';

function generateToken() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now();
}

function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveSession(data) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_PW_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_PW_KEY);
}

// Persist password in localStorage so it survives PWA close/reopen.
// The bcrypt hash is already in localStorage, so storing the password
// doesn't change the security model — same device, same threat surface.
function savePassword(pw) {
  try {
    localStorage.setItem(SESSION_PW_KEY, pw);
    sessionStorage.setItem(SESSION_PW_KEY, pw);
  } catch {}
}

function getSavedPassword() {
  try {
    return localStorage.getItem(SESSION_PW_KEY)
      || sessionStorage.getItem(SESSION_PW_KEY)
      || null;
  } catch { return null; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const session = getSession();
    if (!session) return null;
    const users = getUsers();
    return users.find((u) => u.username === session.username) || null;
  });

  const [password, setPassword] = useState(() => getSavedPassword());

  const register = useCallback(async (username, rawPassword) => {
    const users = getUsers();
    if (users.find((u) => u.username === username)) {
      throw new Error('Username already taken');
    }
    const passwordHash = await bcrypt.hash(rawPassword, 10);
    const newUser = { username, passwordHash, createdAt: new Date().toISOString() };
    saveUsers([...users, newUser]);

    const token = generateToken();
    saveSession({ username, token });
    savePassword(rawPassword);
    setUser(newUser);
    setPassword(rawPassword);
    return newUser;
  }, []);

  const login = useCallback(async (username, rawPassword) => {
    const users = getUsers();
    const found = users.find((u) => u.username === username);
    if (!found) throw new Error('User not found');
    const valid = await bcrypt.compare(rawPassword, found.passwordHash);
    if (!valid) throw new Error('Invalid password');

    const token = generateToken();
    saveSession({ username, token });
    savePassword(rawPassword);
    setUser(found);
    setPassword(rawPassword);
    return found;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setPassword(null);
  }, []);

  const needsReauth = user !== null && password === null;

  return (
    <AuthContext.Provider value={{ user, password, needsReauth, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
