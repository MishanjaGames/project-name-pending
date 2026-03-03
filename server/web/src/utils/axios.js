import axios from "axios";
 
import { getToken, removeToken } from "./auth";
 
const axiosInstanse = axios.create({
    baseURL: "http://localhost:4000/api",
    withCredentials: true
})
 
axiosInstanse.interceptors.request.use(
    (config) => {
        const token = getToken()
        if (token) config.headers["Authorization"] = token // `Bearer ${token}`
 
        return config
    },
    (error) => Promise.reject(error)
)
 
axiosInstanse.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            removeToken()
            window.location.href = "/login"
        }
        return Promise.reject(error)
    }
)
 
export default axiosInstanse
 