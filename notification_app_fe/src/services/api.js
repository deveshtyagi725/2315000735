import axios from "axios"
import { Log } from "./logger"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  timeout: 10000,
  headers: { "Content-Type": "application/json" }
})

api.interceptors.request.use(cfg => {
  cfg.headers["Authorization"] = "Bearer demo_token"
  return cfg
})

api.interceptors.response.use(
  res => res,
  err => {
    Log("frontend", "error", "api", `${err.config?.method?.toUpperCase()} ${err.config?.url} – ${err.message}`)
    return Promise.reject(err)
  }
)

export const getNotifications = (params) => api.get("/notifications", { params })
export const markRead = (id) => api.patch(`/notifications/${id}/read`)
export const markAllRead = () => api.patch("/notifications/read-all")

export default api
