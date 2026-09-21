import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");

      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    console.error("API request setup error:", error);
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,

  (error) => {
    console.error("========== API ERROR ==========");
    console.error("URL:", error.config?.url);
    console.error("Method:", error.config?.method);
    console.error("Base URL:", error.config?.baseURL);
    console.error("Status:", error.response?.status);
    console.error("Response:", error.response?.data);
    console.error("Message:", error.message);
    console.error("================================");

    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        const savedUser = localStorage.getItem("user");

        let role: string | null = null;

        if (savedUser) {
          try {
            role = JSON.parse(savedUser)?.role ?? null;
          } catch {
            role = null;
          }
        }

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        if (role === "ADMIN") {
          window.location.href = "/admin-login";
        } else if (role === "TEACHER") {
          window.location.href = "/teacher-login";
        } else {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
