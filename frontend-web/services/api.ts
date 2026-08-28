import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});
api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        const savedUser = localStorage.getItem("user");

        let role = null;

        if (savedUser) {
          try {
            role = JSON.parse(savedUser)?.role;
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
          window.location.href = "/student-login";
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
