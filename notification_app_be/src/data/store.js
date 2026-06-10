const { v4: uuidv4 } = require("uuid")

function makeId() {
  return `notif_${uuidv4().replace(/-/g, "").slice(0, 10)}`
}

const USER_ID = "usr_7d2e9c4b1f"

const notifications = [
  {
    id: makeId(), userId: USER_ID, type: "Placement",
    title: "Placement Drive – TCS",
    message: "TCS campus placement drive scheduled for Aug 5th. Register before Aug 2nd.",
    isRead: false, isDeleted: false, priority: "HIGH", category: "SYSTEM",
    actionUrl: null, metadata: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    readAt: null, expiresAt: null
  },
  {
    id: makeId(), userId: USER_ID, type: "Result",
    title: "Semester Results Published",
    message: "Your semester 6 results have been published. Check the portal.",
    isRead: false, isDeleted: false, priority: "HIGH", category: "AUTH",
    actionUrl: null, metadata: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    readAt: null, expiresAt: null
  },
  {
    id: makeId(), userId: USER_ID, type: "Event",
    title: "Hackathon Registration Open",
    message: "Inter-college hackathon registrations are now open. Last date: July 20.",
    isRead: true, isDeleted: false, priority: "NORMAL", category: "SYSTEM",
    actionUrl: null, metadata: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    readAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    expiresAt: null
  },
  {
    id: makeId(), userId: USER_ID, type: "Placement",
    title: "Placement Drive – Infosys",
    message: "Infosys is visiting on Aug 10. Eligibility: 7.0+ CGPA.",
    isRead: false, isDeleted: false, priority: "HIGH", category: "SYSTEM",
    actionUrl: null, metadata: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    readAt: null, expiresAt: null
  },
  {
    id: makeId(), userId: USER_ID, type: "Event",
    title: "Cultural Fest – Technomania",
    message: "Annual cultural fest starts from July 25. Register your events.",
    isRead: true, isDeleted: false, priority: "NORMAL", category: "SYSTEM",
    actionUrl: null, metadata: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
    expiresAt: null
  },
  {
    id: makeId(), userId: USER_ID, type: "Result",
    title: "Internal Assessment Marks",
    message: "IA marks for Data Structures have been updated.",
    isRead: false, isDeleted: false, priority: "NORMAL", category: "AUTH",
    actionUrl: null, metadata: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    readAt: null, expiresAt: null
  },
  {
    id: makeId(), userId: USER_ID, type: "Placement",
    title: "Pre-Placement Talk – Wipro",
    message: "Wipro pre-placement talk tomorrow at 2PM in seminar hall.",
    isRead: false, isDeleted: false, priority: "URGENT", category: "SYSTEM",
    actionUrl: null, metadata: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    readAt: null, expiresAt: null
  },
  {
    id: makeId(), userId: USER_ID, type: "Event",
    title: "Workshop: Docker & Kubernetes",
    message: "Free workshop on containers this Saturday. Limited seats.",
    isRead: false, isDeleted: false, priority: "LOW", category: "SYSTEM",
    actionUrl: null, metadata: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    readAt: null, expiresAt: null
  },
  {
    id: makeId(), userId: USER_ID, type: "Result",
    title: "Backlog Exam Schedule",
    message: "Backlog exams scheduled for August 1-5. Check timetable.",
    isRead: true, isDeleted: false, priority: "HIGH", category: "AUTH",
    actionUrl: null, metadata: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 47).toISOString(),
    expiresAt: null
  },
  {
    id: makeId(), userId: USER_ID, type: "Placement",
    title: "Resume Building Session",
    message: "Career cell is hosting a resume review session on Friday.",
    isRead: false, isDeleted: false, priority: "NORMAL", category: "SYSTEM",
    actionUrl: null, metadata: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
    readAt: null, expiresAt: null
  },
  {
    id: makeId(), userId: USER_ID, type: "Event",
    title: "Sports Day Registration",
    message: "Register for sports day events before July 18.",
    isRead: false, isDeleted: false, priority: "LOW", category: "SYSTEM",
    actionUrl: null, metadata: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    readAt: null, expiresAt: null
  },
  {
    id: makeId(), userId: USER_ID, type: "Result",
    title: "Project Viva Marks Updated",
    message: "Viva marks for 6th sem project have been updated on the portal.",
    isRead: false, isDeleted: false, priority: "NORMAL", category: "AUTH",
    actionUrl: null, metadata: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    readAt: null, expiresAt: null
  }
]

module.exports = notifications
