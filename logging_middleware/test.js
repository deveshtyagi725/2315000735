const express = require("express")
const logger = require("./index")

const app = express()
app.use(logger)

app.get("/test", (req, res) => res.json({ status: "ok" }))

const server = app.listen(4000, () => {
  console.log("test server running on port 4000")
})

// basic check
const http = require("http")
setTimeout(() => {
  http.get("http://localhost:4000/test", (res) => {
    console.log("response status:", res.statusCode)
    server.close()
  })
}, 500)
