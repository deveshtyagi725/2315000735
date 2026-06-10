const axios = require("axios")

const LOG_URL = process.env.LOG_API_URL || "http://localhost:5000/api/logs"

async function Log(stack, level, packageName, message) {
  try {
    await axios.post(LOG_URL, {
      stack, level,
      package: packageName,
      message,
      timestamp: new Date().toISOString()
    })
  } catch (_) {}
}

function requestLogger(req, res, next) {
  if (req.path === "/api/logs") return next()
  const t = Date.now()
  res.on("finish", () => {
    process.stdout.write(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - t}ms\n`)
  })
  next()
}

module.exports = { Log, requestLogger }
