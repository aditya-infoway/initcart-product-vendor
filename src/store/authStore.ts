import { create } from "zustand";
import Swal from "sweetalert2";
import { isTokenExpired } from "../utils/tokenUtils";

interface AuthState {
  isAuthenticated: boolean;
  isRestoring: boolean;
  access: string | null;
  refresh: string | null;
  vendor: any | null;
  inactivityTimer: any;

  login: (data: any) => void;
  logout: () => void;
  logoutAndRedirect: () => void;
  setNewAccess: (token: string) => void;
  loadSessionFromStorage: () => void;
  startTimers: () => void;
  clearTimers: () => void;
  resetInactivityTimer: () => void;
}

const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hours

const clearStorage = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("vendor");
  sessionStorage.removeItem("pv_active"); // tab close flag
};

const showSessionAlert = (message: string, onConfirm: () => void) => {
  Swal.fire({
    title: "Session Expired",
    text: message,
    icon: "warning",
    confirmButtonText: "OK",
    allowOutsideClick: false,
  }).then(onConfirm);
};

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isRestoring: true, // shuru mein true
  access: null,
  refresh: null,
  vendor: null,
  inactivityTimer: null,

  loadSessionFromStorage: () => {
    // sessionStorage flag hai → refresh hai → restore karo
    // flag nahi → fresh browser open → login page
    const isPageRefresh = sessionStorage.getItem("pv_active");

    if (isPageRefresh) {
      const access = localStorage.getItem("access");
      const refresh = localStorage.getItem("refresh");
      const vendorStr = localStorage.getItem("vendor");

      if (access && vendorStr && !isTokenExpired(access)) {
        set({
          isAuthenticated: true,
          isRestoring: false,
          access,
          refresh,
          vendor: JSON.parse(vendorStr),
        });
        get().startTimers();
        return;
      }
    }

    // Fresh open ya token expired
    clearStorage();
    set({ isAuthenticated: false, isRestoring: false });
  },

  login: (data) => {
    clearStorage();
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    localStorage.setItem("vendor", JSON.stringify(data.vendor));
    sessionStorage.setItem("pv_active", "true"); // tab active flag

    set({
      isAuthenticated: true,
      isRestoring: false,
      access: data.access,
      refresh: data.refresh,
      vendor: data.vendor,
    });

    get().startTimers();
  },

  setNewAccess: (token) => {
    localStorage.setItem("access", token);
    set({ access: token });
  },

  logout: () => {
    get().clearTimers();
    clearStorage();
    set({
      isAuthenticated: false,
      isRestoring: false,
      access: null,
      refresh: null,
      vendor: null,
    });
  },

  logoutAndRedirect: () => {
    get().clearTimers();
    clearStorage();
    set({
      isAuthenticated: false,
      isRestoring: false,
      access: null,
      refresh: null,
      vendor: null,
    });
    window.location.href = "/productvendor/login";
  },

  startTimers: () => {
    get().clearTimers();

    // Sirf 5-minute inactivity timer
    const inactivityTimer = setTimeout(() => {
      if (window.location.pathname !== "/productvendor/login") {
        showSessionAlert(
          "You were inactive for 1 hour. Please login again.",
          () => get().logoutAndRedirect()
        );
      }
    }, INACTIVITY_TIMEOUT);

    set({ inactivityTimer });
  },

  clearTimers: () => {
    const { inactivityTimer } = get();
    if (inactivityTimer) clearTimeout(inactivityTimer);
    set({ inactivityTimer: null });
  },

  resetInactivityTimer: () => {
    if (!get().isAuthenticated) return;
    if (get().inactivityTimer) clearTimeout(get().inactivityTimer);

    const inactivityTimer = setTimeout(() => {
      if (window.location.pathname !== "/productvendor/login") {
        showSessionAlert(
          "You were inactive for 1 hour. Please login again.",
          () => get().logoutAndRedirect()
        );
      }
    }, INACTIVITY_TIMEOUT);

    set({ inactivityTimer });
  },
}));