import { useEffect, useState, useCallback } from "react"
import {
  Box, Typography, CircularProgress, Alert, Chip,
  FormControl, InputLabel, Select, MenuItem,
  List, ListItem, ListItemText, Divider,
  Pagination, Button, Stack
} from "@mui/material"
import { getNotifications, markRead, markAllRead } from "../services/api"
import { Log } from "../services/logger"

const TYPE_OPTIONS = ["All", "Placement", "Result", "Event"]

export default function AllNotifications() {
  const [notifications, setNotifications] = useState([])
  const [pagination, setPagination] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [filterType, setFilterType] = useState("All")

  const fetchNotifications = useCallback(async (pg, type) => {
    setLoading(true)
    setError(null)

    const params = { page: pg, limit: 5 }
    if (type !== "All") params.type = type

    try {
      const res = await getNotifications(params)
      setNotifications(res.data.data.notifications)
      setPagination(res.data.data.pagination)
      setUnreadCount(res.data.data.unreadCount)
    } catch (err) {
      setError("Failed to load notifications")
      Log("frontend", "error", "AllNotifications", `fetch failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    Log("frontend", "info", "AllNotifications", "page mounted")
    fetchNotifications(1, "All")
  }, [fetchNotifications])

  const handleTypeChange = (e) => {
    const val = e.target.value
    setFilterType(val)
    setPage(1)
    Log("frontend", "info", "AllNotifications", `filter changed to ${val}`)
    fetchNotifications(1, val)
  }

  const handlePageChange = (_, val) => {
    setPage(val)
    Log("frontend", "info", "AllNotifications", `page changed to ${val}`)
    fetchNotifications(val, filterType)
  }

  const handleMarkRead = async (id) => {
    try {
      await markRead(id)
      Log("frontend", "info", "AllNotifications", `marked read: ${id}`)
      fetchNotifications(page, filterType)
    } catch (err) {
      Log("frontend", "error", "AllNotifications", `mark read failed: ${err.message}`)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllRead()
      Log("frontend", "info", "AllNotifications", "marked all as read")
      fetchNotifications(page, filterType)
    } catch (err) {
      Log("frontend", "error", "AllNotifications", `mark all read failed: ${err.message}`)
    }
  }

  const typeColor = { Placement: "primary", Result: "success", Event: "warning" }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Notifications {unreadCount > 0 && <Chip label={`${unreadCount} unread`} size="small" color="error" sx={{ ml: 1 }} />}
        </Typography>
        {unreadCount > 0 && (
          <Button size="small" variant="outlined" onClick={handleMarkAllRead}>
            Mark all read
          </Button>
        )}
      </Stack>

      <FormControl size="small" sx={{ mb: 2, minWidth: 150 }}>
        <InputLabel>Type</InputLabel>
        <Select value={filterType} label="Type" onChange={handleTypeChange}>
          {TYPE_OPTIONS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </Select>
      </FormControl>

      {loading && <Box sx={{ textAlign: "center", py: 4 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && !error && notifications.length === 0 && (
        <Alert severity="info">No notifications found.</Alert>
      )}

      {!loading && notifications.length > 0 && (
        <List sx={{ bgcolor: "background.paper", border: "1px solid #e0e0e0", borderRadius: 1 }}>
          {notifications.map((n, i) => (
            <Box key={n.id}>
              <ListItem
                alignItems="flex-start"
                sx={{ bgcolor: n.isRead ? "inherit" : "#f0f7ff", cursor: "pointer" }}
                onClick={() => !n.isRead && handleMarkRead(n.id)}
                secondaryAction={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={n.type} size="small" color={typeColor[n.type] || "default"} />
                    {!n.isRead && <Chip label="unread" size="small" color="error" variant="outlined" />}
                  </Stack>
                }
              >
                <ListItemText
                  primary={<Typography fontWeight={n.isRead ? 400 : 600}>{n.title}</Typography>}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">{n.message}</Typography>
                      <Typography variant="caption" color="text.disabled">
                        {new Date(n.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              {i < notifications.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      )}

      {pagination && pagination.totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination count={pagination.totalPages} page={page} onChange={handlePageChange} color="primary" />
        </Box>
      )}
    </Box>
  )
}
