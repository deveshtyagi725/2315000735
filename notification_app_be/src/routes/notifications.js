const express = require("express")
const router = express.Router()
const auth = require("../middleware/auth")
const {
  createNotification,
  getAllNotifications,
  getNotificationById,
  markAllRead,
  markOneRead,
  deleteNotification
} = require("../controllers/notificationController")

// read-all must come before /:id so express doesn't treat "read-all" as an id param
router.patch("/read-all", auth, markAllRead)

router.post("/",        auth, createNotification)
router.get("/",         auth, getAllNotifications)
router.get("/:id",      auth, getNotificationById)
router.patch("/:id/read", auth, markOneRead)
router.delete("/:id",   auth, deleteNotification)

module.exports = router
