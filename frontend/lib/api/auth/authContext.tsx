/**
 * Auth Context and Hooks with Zustand Integration
 * Provides authentication state and methods throughout the application
 */

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Routes } from "../FrontendRoutes";
import { BackendRoutes } from "../BackendRoutes";
import {
  tokenManager,
  authUtils,
  useTokenStore,
  TokenResponse,
  FirstFactorTokenResponse,
} from "./TokenManager";
import { api, configureApiClient, isErrorWithCodeType } from "../ApiClient";
import {
  UserType,
  LoginCredentialsType,
  RegisterDataType,
  RegisterResponseType,
  OnboardingStatus,
  OnboardingStatusType,
  ProfilePictureUrls,
  OAuthLoginResponse,
} from "../types/auth";
import { buildLoginRedirectPath } from "@/lib/api/auth/redirect";


export interface ApiErrorType {
  message: string;
  status: number;
  code?: string;
  details?: unknown;
}

export interface PartialUser {
  email?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  profile_picture?: string | ProfilePictureUrls | null;
  phone?: string;
  is_email_verified?: boolean;
  is_phone_verified?: boolean;
  tfa_token?: string;
  onboarding_token?: string;
  onboarding_status?: OnboardingStatusType;
  onboarding_flow?: string[];
}

export function isApiErrorType(error: unknown): error is ApiErrorType {
  const candidate = error as {
    message?: unknown;
    status?: unknown;
    code?: unknown;
  };

  return (
    typeof error === "object" &&
    error !== null &&
    typeof candidate.message === "string" &&
    typeof candidate.status === "number" &&
    // Optional fields
    (typeof candidate.code === "undefined" || typeof candidate.code === "string") &&
    (!("details" in error) || true) // details can be anything
  );
}


const ONBOARDING_ROUTE_MAP: Record<OnboardingStatusType, string> = {
  [OnboardingStatus.NEEDS_BASIC_INFORMATION]: Routes.auth.onboarding.basicInfo,
  [OnboardingStatus.NEEDS_PASSWORD]: Routes.auth.onboarding.password,
  [OnboardingStatus.NEEDS_EMAIL_VERIFICATION]: Routes.auth.onboarding.verifyEmail,
  // Phone verification is currently skipped in frontend flow.
  [OnboardingStatus.NEEDS_PHONE_VERIFICATION]: Routes.auth.onboarding.username,
  [OnboardingStatus.NEEDS_PROFILE_USERNAME]: Routes.auth.onboarding.username,
  [OnboardingStatus.NEEDS_PROFILE_PICTURE]: Routes.auth.onboarding.profilePicture,
  [OnboardingStatus.NEEDS_ORGANIZATION]: Routes.auth.onboarding.organization,
  [OnboardingStatus.COMPLETED]: Routes.home,
};


/**
 * Maps an onboarding status to its corresponding frontend route.
 * Used to redirect users to the correct onboarding step after login/register.
 */
export function getOnboardingRoute(
  status: OnboardingStatusType
): string {
  return ONBOARDING_ROUTE_MAP[status] ?? Routes.home;
}


// Auth Store State
interface AuthState {
  user: UserType | null;
  isLoading: boolean;
  error: ApiErrorType | null;
  partialUser: PartialUser | null;
  onboardingToken: string | null;

  // Actions
  setUser: (user: UserType | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: ApiErrorType | null) => void;
  setPartialUser: (partialUser: PartialUser | null) => void;
  setOnboardingToken: (onboardingToken: string | null) => void;
  updatePartialUser: (partialUser: PartialUser) => void;
  clearError: () => void;
}

// Create Auth Store with Zustand
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,
      partialUser: null,
      onboardingToken: null,

      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      setPartialUser: (partialUser) => set({ partialUser }),
      setOnboardingToken: (onboardingToken) => set({ onboardingToken }),
      updatePartialUser: (partialUser) => {
        set((state) => ({
          partialUser: { ...state.partialUser, ...partialUser },
        }));
      },
    }),
    {
      name: "auth-user-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        partialUser: state.partialUser,
        onboardingToken: state.onboardingToken,
      }),
    }
  )
);

// Auth Context Type
export interface AuthContextType {
  user: UserType | null;
  partialUser: PartialUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: ApiErrorType | null;
  login: (credentials: LoginCredentialsType) => Promise<void>;
  register: (data: RegisterDataType) => Promise<RegisterResponseType>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  clearError: () => void;
  updatePartialUser: (partialUser: PartialUser) => void;
  onboardingToken: string | null;
  setOnboardingToken: (onboardingToken: string | null) => void;
  doAuthCheck: () => Promise<void>;
  exchangeOnboardingTokenForAuth: (onboardingToken: string) => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
  onLogout?: () => void;
}

/**
 * Auth Provider Component
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  onLogout,
}) => {
  // Subscribe to Zustand stores
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setError = useAuthStore((state) => state.setError);
  const clearError = useAuthStore((state) => state.clearError);
  const partialUser = useAuthStore((state) => state.partialUser);
  const setPartialUser = useAuthStore((state) => state.setPartialUser);
  const updatePartialUser = useAuthStore((state) => state.updatePartialUser);
  const onboardingToken = useAuthStore((state) => state.onboardingToken);
  const setOnboardingToken = useAuthStore((state) => state.setOnboardingToken);

  // Track if auth has been initialized
  const [initialized, setInitialized] = useState(false);
  const initGuardRef = useRef(false);

  /**
   * Fetch current user data
   */
  const fetchCurrentUser = useCallback(async (): Promise<void> => {
    try {
      const response = await api.get<UserType>(BackendRoutes.me);
      setUser(response.data);
      updatePartialUser({
        email: response.data.email,
        phone: response.data.phone_number ?? undefined,
        is_email_verified: response.data.is_email_verified,
        is_phone_verified: response.data.is_phone_number_verified,
        onboarding_status: response.data.onboarding_status,
        onboarding_token: response.data.onboarding_token ?? undefined,
      });
      if (response.data.onboarding_token) {
        setOnboardingToken(response.data.onboarding_token);
      }
      setError(null);
    } catch (error) {
      console.error("[Auth] Failed to fetch user:", error);
      throw error;
    }
  }, [setUser, updatePartialUser, setOnboardingToken, setError]);

  /**
   * Initialize authentication state
   */
  const initializeAuth = useCallback(async () => {
    setLoading(true);
    tokenManager.syncAuthPresenceCookie();

    try {
      // If an OAuth exchange is currently in progress, avoid fetching
      // `/me` here. The callback will finish the exchange and set
      // onboarding/auth state explicitly. This prevents a race where a
      // background `/me` request runs before the onboarding token is
      // persisted.
      const oauthExchange = (() => {
        try {
          return typeof sessionStorage !== 'undefined' && sessionStorage.getItem('oauth_exchange');
        } catch (e) {
          return null;
        }
      })();

      if (oauthExchange) {
        // Skip fetching the current user while an OAuth exchange is running.
        // Leave user as null so onboarding flows can proceed.
      } else if (authUtils.isAuthenticated()) {
        await fetchCurrentUser();
      } else {
        // Clear stale user data if token is invalid
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          setUser(null);
        }
      }
    } catch (error) {
      console.error("[Auth] Initialization failed:", error);
      if (isApiErrorType(error) && error.status === 401) {
        authUtils.logout();
        setUser(null);
        setPartialUser(null);
        setOnboardingToken(null);
        return;
      }

      if (isErrorWithCodeType(error)) {
        if (
          error?.code == "REQUEST_TIMEOUT" ||
          error?.code == "NETWORK_ERROR"
        ) {
          // alert(error.message);
          console.error(error.message);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [fetchCurrentUser, setUser, setPartialUser, setOnboardingToken, setLoading]);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    if (initialized || initGuardRef.current) return;
    initGuardRef.current = true;

    let cancelled = false;
    const run = async () => {
      try {
        await initializeAuth();
      } finally {
        if (!cancelled) {
          setInitialized(true);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [initialized, initializeAuth]);

  const doAuthCheck = async () => {
    const next = buildLoginRedirectPath(
      `${window.location.pathname}${window.location.search}`,
      Routes.auth.login
    );
    if (!authUtils.isAuthenticated() && !isLoading) {
      router.replace(next);
    }
  };

  function isFirstFactor(
    data: TokenResponse | FirstFactorTokenResponse
  ): data is FirstFactorTokenResponse {
    return "tfa_token" in data;
  }

  /**
   * Login user
   */
  const login = async (_credentials: LoginCredentialsType): Promise<void> => {
    throw new Error("Deprecated: use AuthService.login and useLoginSuccess instead.");
  };

  /**
   * Register new user
   */
  const register = async (_data: RegisterDataType): Promise<RegisterResponseType> => {
    throw new Error("Deprecated: use AuthService.register and useRegisterSuccess instead.");
  };

  /**
   * Logout user
   */
  const handleLogout = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      // Clear tokens and user state
      authUtils.logout();
      setUser(null);
      setError(null);

      // Call optional logout callback
      if (onLogout) {
        onLogout();
      }

      console.log("[Auth] Logout successful");
    } catch (error) {
      console.error("[Auth] Logout failed:", error);
    } finally {
      setLoading(false);
    }
  }, [onLogout, setUser, setError, setLoading]);

  /**
   * Configure API client with logout handler
   */
  useEffect(() => {
    configureApiClient({
      onUnauthorized: handleLogout,
    });
  }, [handleLogout]);

  /**
   * Refresh user data
   */
  const refreshUser = async (): Promise<void> => {
    if (!authUtils.isAuthenticated()) {
      return;
    }

    try {
      await fetchCurrentUser();
    } catch (error) {
      console.error("[Auth] Failed to refresh user:", error);
      throw error;
    }
  };

  /**
   * Exchange onboarding token for JWT auth tokens after completing onboarding
   */
  const exchangeOnboardingTokenForAuth = async (onboardingToken: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const OnboardingService = (await import("@/lib/api/services/Onboarding.Service")).default;
      const response = await OnboardingService.exchangeOnboardingTokens({
        onboarding_token: onboardingToken,
      });

      // Initialize token manager with JWT tokens
      authUtils.initializeAuth({
        access: response.access,
        refresh: response.refresh,
        access_expiry: response.access_expiry || "",
        refresh_expiry: response.refresh_expiry || "",
      });

      // Clear onboarding state
      setOnboardingToken(null);
      setPartialUser(null);

      // Fetch user data
      await fetchCurrentUser();

      console.log("[Auth] Onboarding token exchange successful");
    } catch (error) {
      console.error("[Auth] Failed to exchange onboarding token:", error);
      if (isApiErrorType(error)) {
        setError(error);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && authUtils.isAuthenticated(),
    isLoading: isLoading || !initialized,
    error,
    login,
    register,
    logout: handleLogout,
    refreshUser,
    fetchCurrentUser,
    clearError,
    partialUser,
    updatePartialUser,
    onboardingToken,
    setOnboardingToken,
    doAuthCheck,
    exchangeOnboardingTokenForAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth Hook
 * Access auth context from any component
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

/**
 * useRequireAuth Hook
 * Redirect to login if not authenticated
 */
type UseRequiredAuthOptions = {
  allowOnboarding?: boolean;
};

export const useRequiredAuth = (
  redirectTo: string = Routes.auth.login,
  options: UseRequiredAuthOptions = {}
): AuthContextType => {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const allowOnboarding = Boolean(options.allowOnboarding);

  useEffect(() => {
    if (auth.isLoading) return;

    const hasOnboardingIdentity = Boolean(
      auth.onboardingToken ||
        auth.partialUser?.onboarding_token ||
        auth.partialUser?.email
    );

    if (!auth.isAuthenticated && !(allowOnboarding && hasOnboardingIdentity)) {
      if (redirectTo === Routes.auth.login) {
        router.replace(buildLoginRedirectPath(pathname, redirectTo));
      } else {
        router.replace(redirectTo);
      }
    }
  }, [
    auth.isAuthenticated,
    auth.isLoading,
    auth.onboardingToken,
    auth.partialUser,
    allowOnboarding,
    redirectTo,
    router,
    pathname,
  ]);

  return auth;
};

/**
 * Protected Route Component
 */
interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback = <div>Loading Protected Route...</div>,
  redirectTo = Routes.auth.login,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      const next = buildLoginRedirectPath(
        `${window.location.pathname}${window.location.search}`,
        redirectTo
      );
      router.replace(next);
      return;
    }

    if (user && user.onboarding_status !== OnboardingStatus.COMPLETED) {
      router.replace(getOnboardingRoute(user.onboarding_status));
    }
  }, [isAuthenticated, isLoading, redirectTo, router, user]);

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (user && user.onboarding_status !== OnboardingStatus.COMPLETED) {
    return null;
  }

  return <>{children}</>;
};

/**
 * Token Status Hook
 * Get current token status and time until expiry (using Zustand store)
 */
export const useTokenStatus = () => {
  const getTimeUntilExpiry = useTokenStore((state) => state.getTimeUntilExpiry);
  const isValid = useTokenStore((state) => state.isAccessTokenValid());

  const [timeUntilExpiry, setTimeUntilExpiry] = useState<number | null>(
    getTimeUntilExpiry()
  );

  useEffect(() => {
    const updateStatus = () => {
      setTimeUntilExpiry(getTimeUntilExpiry());
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, [getTimeUntilExpiry]);

  return {
    timeUntilExpiry,
    isValid,
    formattedTime: timeUntilExpiry
      ? `${Math.floor(timeUntilExpiry / 60)}m ${timeUntilExpiry % 60}s`
      : null,
  };
};

/**
 * Hook to access token store directly (for advanced usage)
 */
export const useTokens = () => {
  const access = useTokenStore((state) => state.access);
  const refresh = useTokenStore((state) => state.refresh);
  const accessExpiry = useTokenStore((state) => state.accessExpiry);
  const refreshExpiry = useTokenStore((state) => state.refreshExpiry);
  const isRefreshing = useTokenStore((state) => state.isRefreshing);

  return {
    access,
    refresh,
    accessExpiry,
    refreshExpiry,
    isRefreshing,
  };
};

/**
 * Hook to access auth store directly (for advanced usage)
 */
export const useAuthUser = () => {
  return useAuthStore((state) => state.user);
};
