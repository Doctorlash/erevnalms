import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import api from "../services/api";
import { User } from "../types/user";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isHydrated: boolean;

  studentLogin: (email: string, password: string) => Promise<User>;
  teacherLogin: (email: string, password: string) => Promise<User>;
  adminLogin: (email: string, password: string) => Promise<User>;

  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  /**
   * Prevent auth guards from redirecting before
   * localStorage has been checked.
   */
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (savedToken && savedUser) {
        const parsedUser: User = JSON.parse(savedUser);

        setToken(savedToken);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error("Failed to restore authentication session:", error);

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setToken(null);
      setUser(null);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const authenticate = async (
    endpoint: string,
    email: string,
    password: string,
  ): Promise<User> => {
    const response = await api.post(endpoint, {
      email,
      password,
    });

    const { access_token, user } = response.data;

    localStorage.setItem("token", access_token);
    localStorage.setItem("user", JSON.stringify(user));

    setToken(access_token);
    setUser(user);

    return user;
  };

  const studentLogin = (email: string, password: string): Promise<User> => {
    return authenticate("/auth/student-login", email, password);
  };

  const teacherLogin = (email: string, password: string): Promise<User> => {
    return authenticate("/auth/teacher-login", email, password);
  };

  const adminLogin = (email: string, password: string): Promise<User> => {
    return authenticate("/auth/admin-login", email, password);
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((currentUser) => {
      if (!currentUser) {
        return currentUser;
      }

      const updatedUser: User = {
        ...currentUser,
        ...updates,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));

      return updatedUser;
    });
  };

  /**
   * Logout only clears authentication state.
   *
   * Navigation is handled by LogoutButton so that
   * each role can be sent to its correct login page.
   */
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isHydrated,

        studentLogin,
        teacherLogin,
        adminLogin,

        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
