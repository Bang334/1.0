import axios from 'axios';
import { toast } from 'react-toastify';

// Use full backend URL instead of relative path
const BASE_URL = "http://localhost:8080/api";
export const API_URL = BASE_URL;

const instance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

instance.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.token) {
      config.headers["Authorization"] = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (res) => {
    return res; 
  },
  async (err) => {
    if (err.response && err.response.status === 401) {
      // localStorage.removeItem("user");
      // toast.error('Phiên đăng nhập đã hết hạn', {
      //   id: 'expired-session',
      //   position: "top-right",
      //   autoClose: 3000,
      //   hideProgressBar: false,
      //   closeOnClick: true,
      //   pauseOnHover: true,
      //   draggable: true,
      // });
      // setTimeout(() => {
      //   window.location.href = "/login";
      // }, 1500);
      return Promise.reject(err);
    }
    return Promise.reject(err);
  }
);

export default instance;