const LOG_URL = import.meta.env.VITE_LOG_URL || "http://localhost:5000/api/logs"

export function Log(stack, level, pkg, message) {
  fetch(LOG_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stack, level, package: pkg, message, timestamp: new Date().toISOString() })
  }).catch(() => {})
}
