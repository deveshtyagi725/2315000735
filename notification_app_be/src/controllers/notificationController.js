const { v4: uuidv4 } = require("uuid")
const { Log } = require("../../../logging_middleware/index")
const store = require("../data/store")

const TYPES = ["Placement", "Result", "Event"]
const PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"]
const CATEGORIES = ["AUTH", "DOCUMENT", "APPOINTMENT", "SYSTEM", "SECURITY"]

const createNotification = async (req, res) => {
  const { userId, type, title, message, priority = "NORMAL", category, actionUrl, metadata, expiresAt } = req.body

  if (!userId || !type || !title || !message || !category) {
    return res.status(400).json({ status: "error", code: "VALIDATION_ERROR", message: "userId, type, title, message, category are required", timestamp: new Date().toISOString() })
  }

  if (!TYPES.includes(type) || !PRIORITIES.includes(priority) || !CATEGORIES.includes(category)) {
    return res.status(400).json({ status: "error", code: "VALIDATION_ERROR", message: "invalid type, priority or category", timestamp: new Date().toISOString() })
  }

  const notif = {
    id: `notif_${uuidv4().replace(/-/g, "").slice(0, 10)}`,
    userId, type, title, message,
    isRead: false, isDeleted: false,
    priority, category,
    actionUrl: actionUrl || null,
    metadata: metadata || null,
    createdAt: new Date().toISOString(),
    readAt: null, expiresAt: expiresAt || null
  }

  store.push(notif)
  await Log("backend", "info", "notifications", `created ${notif.id} for ${userId}`)
  return res.status(201).json({ status: "success", data: notif })
}

const getAllNotifications = async (req, res) => {
  const { page = 1, limit = 10, isRead, type, priority, sortBy = "createdAt", sortOrder = "desc" } = req.query
  const uid = req.user.id
  const pg = parseInt(page)
  const lim = Math.min(parseInt(limit), 100)

  let data = store.filter(n => n.userId === uid && !n.isDeleted)
  if (isRead !== undefined) data = data.filter(n => n.isRead === (isRead === "true"))
  if (type) data = data.filter(n => n.type === type)
  if (priority) data = data.filter(n => n.priority === priority)

  data.sort((a, b) => {
    const dir = sortOrder === "asc" ? 1 : -1
    return a[sortBy] > b[sortBy] ? dir : -dir
  })

  const total = data.length
  const pages = Math.ceil(total / lim)
  const offset = (pg - 1) * lim
  const unread = store.filter(n => n.userId === uid && !n.isRead && !n.isDeleted).length

  await Log("backend", "info", "notifications", `GET page=${pg} uid=${uid} count=${data.slice(offset, offset + lim).length}`)

  return res.status(200).json({
    status: "success",
    data: {
      notifications: data.slice(offset, offset + lim),
      pagination: { currentPage: pg, totalPages: pages, totalCount: total, limit: lim, hasNextPage: pg < pages, hasPrevPage: pg > 1 },
      unreadCount: unread
    }
  })
}

const getNotificationById = (req, res) => {
  const notif = store.find(n => n.id === req.params.id && !n.isDeleted)
  if (!notif) return res.status(404).json({ status: "error", code: "NOT_FOUND", message: "notification not found", timestamp: new Date().toISOString() })
  if (notif.userId !== req.user.id) return res.status(403).json({ status: "error", code: "FORBIDDEN", message: "not yours", timestamp: new Date().toISOString() })
  return res.status(200).json({ status: "success", data: notif })
}

const markAllRead = async (req, res) => {
  const uid = req.user.id
  const now = new Date().toISOString()
  const unread = store.filter(n => n.userId === uid && !n.isRead && !n.isDeleted)
  if (!unread.length) return res.status(404).json({ status: "error", code: "NO_UNREAD", message: "nothing to mark", timestamp: now })
  unread.forEach(n => { n.isRead = true; n.readAt = now })
  await Log("backend", "info", "notifications", `marked all read uid=${uid} count=${unread.length}`)
  return res.status(200).json({ status: "success", message: "All marked as read.", data: { updatedCount: unread.length, readAt: now } })
}

const markOneRead = async (req, res) => {
  const notif = store.find(n => n.id === req.params.id && !n.isDeleted)
  if (!notif) return res.status(404).json({ status: "error", code: "NOT_FOUND", message: "not found", timestamp: new Date().toISOString() })
  if (notif.userId !== req.user.id) return res.status(403).json({ status: "error", code: "FORBIDDEN", message: "not yours", timestamp: new Date().toISOString() })
  if (notif.isRead) return res.status(409).json({ status: "error", code: "ALREADY_READ", message: "already read", timestamp: new Date().toISOString() })
  notif.isRead = true
  notif.readAt = new Date().toISOString()
  await Log("backend", "info", "notifications", `read: ${notif.id}`)
  return res.status(200).json({ status: "success", message: "Marked as read.", data: { id: notif.id, isRead: true, readAt: notif.readAt } })
}

const deleteNotification = async (req, res) => {
  const notif = store.find(n => n.id === req.params.id)
  if (!notif || notif.isDeleted) return res.status(404).json({ status: "error", code: "NOT_FOUND", message: "not found", timestamp: new Date().toISOString() })
  if (notif.userId !== req.user.id) return res.status(403).json({ status: "error", code: "FORBIDDEN", message: "not yours", timestamp: new Date().toISOString() })
  notif.isDeleted = true
  notif.deletedAt = new Date().toISOString()
  await Log("backend", "info", "notifications", `deleted: ${notif.id}`)
  return res.status(200).json({ status: "success", message: "Deleted.", data: { id: notif.id, deletedAt: notif.deletedAt } })
}

module.exports = { createNotification, getAllNotifications, getNotificationById, markAllRead, markOneRead, deleteNotification }
