import { createContext, useContext, useState, useEffect, useCallback } from "react";
import PropTypes from 'prop-types';
import { authAPI } from "../lib/api.js";
import { generateAndStoreKeyPair, getStoredPublicKeyBase64 } from "../lib/crypto.js";
import { clearAuthSession, getStoredUserRaw, getToken, pinAuthToThisTab, setAuthSession, setStoredUser } from "../lib/authStorage.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const initAuth = async () => {
      pinAuthToThisTab();
      const token = getToken();
      const storedUser = getStoredUserRaw();

      if (token && storedUser) {
        try {
          // Verify token is still valid
          const response = await authAPI.getMe();
          const userData = response.data?.user || JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
          setStoredUser(userData);
          await ensureKeyPair(userData);
        } catch {
          // Token invalid — clear auth
          clearAuthSession();
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Login — calls real API, stores JWT + user data.
   */
  const login = useCallback(async (email, password) => {
    try {
      if (!email || !password) {
        return { success: false, error: 'البريد الإلكتروني وكلمة المرور مطلوبان' };
      }

      const response = await authAPI.login({ email, password });
      const { token, user: userData } = response.data;

      // Store JWT
      setAuthSession(token, userData);

      setUser(userData);
      setIsAuthenticated(true);

      // Ensure E2EE keys exist and match this browser
      await ensureKeyPair(userData);

      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'حدث خطأ أثناء تسجيل الدخول',
        code: error.code,
      };
    }
  }, []);

  /**
   * Google sign-in — the ID token is verified by the server, which signs the
   * visitor in (or creates a student account) and returns our own JWT.
   */
  const loginWithGoogle = useCallback(async (credential, role) => {
    try {
      const response = await authAPI.google({ credential, ...(role ? { role } : {}) });
      const { token, user: userData } = response.data;

      setAuthSession(token, userData);
      setUser(userData);
      setIsAuthenticated(true);

      // New browsers/accounts need their E2EE key pair created and synced
      await ensureKeyPair(userData);

      return { success: true, user: userData, isNew: !!response.data.isNew };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'تعذر تسجيل الدخول عبر Google',
      };
    }
  }, []);

  /**
   * Opening the emailed link proves the inbox is theirs, so the server signs them in.
   */
  const verifyEmail = useCallback(async (token) => {
    try {
      const response = await authAPI.verifyEmail({ token });

      // Providers confirm their email first, then wait for the admin: no session yet
      if (response.data?.pendingApproval) {
        return { success: true, pendingApproval: true, message: response.data.message };
      }

      const { token: jwt, user: userData } = response.data;

      setAuthSession(jwt, userData);
      setUser(userData);
      setIsAuthenticated(true);
      await ensureKeyPair(userData);

      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'تعذر تأكيد البريد الإلكتروني',
      };
    }
  }, []);

  /**
   * Register — creates the account; a confirmation email must be opened before login.
   */
  const register = useCallback(async (name, email, password, role = 'student', extra = {}) => {
    try {
      if (!name || !email || !password) {
        return { success: false, error: 'جميع الحقول مطلوبة' };
      }

      if (password.length < 6) {
        return { success: false, error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' };
      }

      const response = await authAPI.register({ name, email, password, role, ...extra });

      // The account stays locked until the emailed link is opened, so there is no session yet
      return {
        success: true,
        requiresVerification: !!response.data?.requiresVerification,
        needsApproval: !!response.data?.needsApproval,
        email: response.data?.email || email,
        emailSent: response.data?.emailSent !== false,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'حدث خطأ أثناء التسجيل',
      };
    }
  }, []);

  /**
   * Ensure E2EE key pair exists, generate if not.
   */
  const ensureKeyPair = async (userData) => {
    try {
      // Keep the server public key equal to the private key in THIS browser.
      // Otherwise the other person wraps messages for a key we cannot open.
      let publicKey = await getStoredPublicKeyBase64(userData.id);
      if (!publicKey) {
        publicKey = await generateAndStoreKeyPair(userData.id);
      }
      const serverKey = userData.public_key || userData.publicKey || '';
      if (serverKey !== publicKey) {
        const { userAPI } = await import('../lib/api.js');
        await userAPI.updatePublicKey(publicKey);
      }
    } catch (err) {
      console.warn('Key pair sync failed:', err);
    }
  };

  /**
   * Logout — clear JWT, user data, and disconnect socket.
   */
  const logout = useCallback(() => {
    clearAuthSession();
    setUser(null);
    setIsAuthenticated(false);

    // Disconnect socket if connected
    import('../lib/socket.js').then(({ disconnectSocket }) => {
      disconnectSocket();
    });
  }, []);

  const updateUser = useCallback((userData) => {
    if (!userData) return;
    setUser(userData);
    setStoredUser(userData);
  }, []);

  const refreshUser = useCallback(async () => {
    const response = await authAPI.getMe();
    const userData = response.data?.user;
    if (userData) updateUser(userData);
    return userData;
  }, [updateUser]);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    loginWithGoogle,
    register,
    verifyEmail,
    logout,
    updateUser,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
