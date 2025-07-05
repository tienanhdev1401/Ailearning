import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

let storeAccessToken = null;

export const setAccessToken = (token) => {
  storeAccessToken = token;
};

api.interceptors.request.use(
  (config) => {
    if (storeAccessToken) {
      config.headers.Authorization = `Bearer ${storeAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&                          //Nếu đã retry rồi mà vẫn lỗi, không được gọi lại nữa.
      !originalRequest.url.includes("/auth/refresh") &&  //tránh vòng lập refesh token bị gọi đi nhiều lần
      !originalRequest.url.includes("/auth/login")      // khong refesh token khi đăng nhập
    ) {
      originalRequest._retry = true;
      try {
        const res = await api.post("/auth/refresh");
        const newAccessToken = res.data.accessToken;
        console.log('new acess token', newAccessToken);
        setAccessToken(newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (err) {
        console.error("❌ Refresh token hết hạn. Chuyển về /login.");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;