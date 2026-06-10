import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom"
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material"
import AllNotifications from "./pages/AllNotifications"
import PriorityNotifications from "./pages/PriorityNotifications"
import { Log } from "./services/logger"
import { useEffect, useRef } from "react"

function Nav() {
  const location = useLocation()
  const prevPath = useRef(null)

  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      prevPath.current = location.pathname
      Log("frontend", "info", "navigation", `navigated to ${location.pathname}`)
    }
  }, [location.pathname])

  return (
    <AppBar position="static" color="primary" elevation={1}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
          AffordMed Notifications
        </Typography>
        <Button color="inherit" component={Link} to="/"
          sx={{ fontWeight: location.pathname === "/" ? 700 : 400 }}>
          All
        </Button>
        <Button color="inherit" component={Link} to="/priority"
          sx={{ fontWeight: location.pathname === "/priority" ? 700 : 400 }}>
          Priority
        </Button>
      </Toolbar>
    </AppBar>
  )
}

export default function App() {
  useEffect(() => {
    Log("frontend", "info", "app", "app mounted")
  }, [])

  return (
    <BrowserRouter>
      <Nav />
      <Box sx={{ maxWidth: 900, mx: "auto", px: 2, py: 3 }}>
        <Routes>
          <Route path="/" element={<AllNotifications />} />
          <Route path="/priority" element={<PriorityNotifications />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </BrowserRouter>
  )
}
