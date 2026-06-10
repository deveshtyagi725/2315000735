import { useEffect, useState, useCallback } from "react"
import {
  Box, Typography, CircularProgress, Alert,
  Chip, List, ListItem, ListItemText, Divider,
  FormControl, InputLabel, Select, MenuItem, Stack
} from "@mui/material"
import { getNotifications } from "../services/api"
import { Log } from "../services/logger"

const TYPE_RANK = { Placement: 3, Result: 2, Event: 1 }
const TOP_N_OPTIONS = [3, 5, 10]

function scoreNotification(n) {
  const typeScore = TYPE_RANK[n.type] || 0
  const ageScore = new Date(n.createdAt).getTime() / 1e12
  return typeScore * 10 + ageScore
}

export default function PriorityNotifications() {
  const [all, setAll] = useState([])
  const [topN, setTopN] = useState(5)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getNotifications({ page: 1, limit: 100 })
      setAll(res.data.data.notifications)
      Log("frontend", "info", "PriorityNotifications", "fetched notifications for ranking")
    } catch (err) {
      setError("Failed to load notifications")
      Log("frontend", "error", "PriorityNotifications", `fetch failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    Log("frontend", "info", "PriorityNotifications", "page mounted")
    fetchAll()
  }, [fetchAll])

  const handleTopNChange = (e) => {
    const val = e.target.value
    setTopN(val)
    Log("frontend", "info", "PriorityNotifications", `top N changed to ${val}`)
  }

  const ranked = [...all]
    .sort((a, b) => scoreNotification(b) - scoreNotification(a))
    .slice(0, topN)

  const typeColor = { Placement: "primary", Result: "success", Event: "warning" }
  const priorityColor = { URGENT: "error", HIGH: "warning", NORMAL: "default", LOW: "default" }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>Priority Inbox</Typography>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Top N</InputLabel>
          <Select value={topN} label="Top N" onChange={handleTopNChange}>
            {TOP_N_OPTIONS.map(n => <MenuItem key={n} value={n}>Top {n}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>

      <Typography variant="body2" color="text.secondary" mb={2}>
        Ranked by type priority (Placement &gt; Result &gt; Event) then by recency.
      </Typography>

      {loading && <Box sx={{ textAlign: "center", py: 4 }}><CircularProgress /></Box>}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && ranked.length === 0 && (
        <Alert severity="info">No notifications to rank.</Alert>
      )}

      {!loading && ranked.length > 0 && (
        <List sx={{ bgcolor: "background.paper", border: "1px solid #e0e0e0", borderRadius: 1 }}>
          {ranked.map((n, i) => (
            <Box key={n.id}>
              <ListItem
                alignItems="flex-start"
                sx={{ bgcolor: n.isRead ? "inherit" : "#f0f7ff" }}
                secondaryAction={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={n.type} size="small" color={typeColor[n.type] || "default"} />
                    <Chip label={n.priority} size="small" color={priorityColor[n.priority] || "default"} variant="outlined" />
                  </Stack>
                }
              >
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2"
                        sx={{ bgcolor: "grey.200", px: 1, borderRadius: 1, fontWeight: 700, minWidth: 24, textAlign: "center" }}>
                        #{i + 1}
                      </Typography>
                      <Typography fontWeight={n.isRead ? 400 : 600}>{n.title}</Typography>
                    </Stack>
                  }
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
              {i < ranked.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      )}
    </Box>
  )
}
