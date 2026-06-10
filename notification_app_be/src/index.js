require("dotenv").config()
const express = require("express")
const cors = require("cors")
const { Log, requestLogger } = require("../../logging_middleware/index")
const notificationRoutes = require("./routes/notifications")

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())
app.use(requestLogger)

app.use("/api/v1/notifications", notificationRoutes)

app.get("/health", (req, res) => res.json({ status: "ok" }))

// log endpoint so frontend logger can POST here
app.post("/api/logs", (req, res) => {
  const { stack, level, package: pkg, message, timestamp } = req.body
  process.stdout.write(`[${timestamp}] [${stack}] [${level}] [${pkg}] ${message}\n`)
  res.status(200).json({ ok: true })
})

app.listen(PORT, async () => {
  await Log("backend", "info", "server", `server started on port ${PORT}`)
})

module.exports = app
