export const COLUMNS = [
  { id: "todo", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "in_review", title: "In Review" },
  { id: "done", title: "Done" },
]

const STATUS_NAMES = Object.fromEntries(COLUMNS.map((c) => [c.id, c.title]))

export function dueStatus(task) {
  if (!task.due_date) return null

  const due = new Date(task.due_date + "T00:00:00")
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round((due - today) / 86400000)
  const text = due.toLocaleDateString(undefined, { month: "short", day: "numeric" })

  if (task.status === "done") return { text, className: "" }
  if (days < 0) return { text: "Overdue · " + text, className: "overdue" }
  if (days === 0) return { text: "Due today", className: "soon" }
  if (days <= 2) return { text: "Due soon · " + text, className: "soon" }
  return { text, className: "" }
}

export function dueCategory(task) {
  const due = dueStatus(task)
  if (!due) return "none"
  return due.className || "later"
}

export function timeAgo(date) {
  const minutes = Math.floor((Date.now() - new Date(date)) / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}

export function describeActivity(a) {
  switch (a.action) {
    case "created":
      return "Created the task"
    case "status_changed":
      return `Moved from ${STATUS_NAMES[a.from_value]} → ${STATUS_NAMES[a.to_value]}`
    case "edited":
      return "Edited the task"
    case "assigned":
      return `Assigned ${a.to_value}`
    case "unassigned":
      return `Unassigned ${a.to_value}`
    case "label_added":
      return `Added label ${a.to_value}`
    case "label_removed":
      return `Removed label ${a.to_value}`
    default:
      return a.action
  }
}
