// simple auth check — in prod this would verify a real JWT
const auth = (req, res, next) => {
  const header = req.headers["authorization"]

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      status: "error",
      code: "UNAUTHORIZED",
      message: "missing or invalid token",
      timestamp: new Date().toISOString()
    })
  }

  const token = header.split(" ")[1]

  // for the assessment we're faking the decoded user from the token
  // in prod: jwt.verify(token, process.env.JWT_SECRET)
  if (token === "invalid") {
    return res.status(401).json({
      status: "error",
      code: "UNAUTHORIZED",
      message: "expired or invalid token",
      timestamp: new Date().toISOString()
    })
  }

  // mock decoded user — real JWT would give us this
  req.user = { id: "usr_7d2e9c4b1f" }
  next()
}

module.exports = auth
