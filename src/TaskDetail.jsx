import { useEffect, useState } from "react"
import { supabase } from "./db"
import Avatar from "./Avatar"
import { COLUMNS, describeActivity, timeAgo } from "./utils"

function fetchComments(taskId) {
  return supabase.from("comments").select("*, profiles (name)").eq("task_id", taskId).order("created_at")
}

function fetchActivity(taskId) {
  return supabase.from("task_activity_log").select("*").eq("task_id", taskId).order("created_at", { ascending: false })
}

function TaskDetail({ task, members, labels, onClose, onChange }) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || "")
  const [status, setStatus] = useState(task.status)
  const [priority, setPriority] = useState(task.priority)
  const [dueDate, setDueDate] = useState(task.due_date || "")
  const [comments, setComments] = useState([])
  const [activity, setActivity] = useState([])
  const [comment, setComment] = useState("")
  const [error, setError] = useState("")

  async function getComments() {
    const { data, error } = await fetchComments(task.id)
    if (error) return setError(error.message)
    setComments(data)
  }

  async function getActivity() {
    const { data, error } = await fetchActivity(task.id)
    if (error) return setError(error.message)
    setActivity(data)
  }

  useEffect(() => {
    async function load() {
      const [commentsRes, activityRes] = await Promise.all([fetchComments(task.id), fetchActivity(task.id)])
      if (commentsRes.error || activityRes.error) {
        return setError((commentsRes.error || activityRes.error).message)
      }
      setComments(commentsRes.data)
      setActivity(activityRes.data)
    }
    load()
  }, [task.id])

  function refresh() {
    onChange()
    getActivity()
  }

  async function saveTask(e) {
    e.preventDefault()
    if (!title.trim()) return

    const { error } = await supabase
      .from("tasks")
      .update({ title: title.trim(), description: description || null, status, priority, due_date: dueDate || null })
      .eq("id", task.id)
    if (error) return setError(error.message)
    refresh()
  }

  async function deleteTask() {
    if (!confirm("Delete this task?")) return

    const { error } = await supabase.from("tasks").delete().eq("id", task.id)
    if (error) return setError(error.message)
    onChange()
    onClose()
  }

  async function toggleAssignee(member) {
    const assigned = task.assignees.some((m) => m.id === member.id)
    const { error } = assigned
      ? await supabase.from("task_assignees").delete().eq("task_id", task.id).eq("member_id", member.id)
      : await supabase.from("task_assignees").insert({ task_id: task.id, member_id: member.id })
    if (error) return setError(error.message)
    refresh()
  }

  async function toggleLabel(label) {
    const added = task.labels.some((l) => l.id === label.id)
    const { error } = added
      ? await supabase.from("task_labels").delete().eq("task_id", task.id).eq("label_id", label.id)
      : await supabase.from("task_labels").insert({ task_id: task.id, label_id: label.id })
    if (error) return setError(error.message)
    refresh()
  }

  async function addComment(e) {
    e.preventDefault()
    if (!comment.trim()) return

    const { error } = await supabase.from("comments").insert({ task_id: task.id, comment: comment.trim() })
    if (error) return setError(error.message)
    setComment("")
    getComments()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="detail" onClick={(e) => e.stopPropagation()}>
        <div className="detail-header">
          <h2>Task details</h2>
          <button className="secondary" onClick={onClose}>Close</button>
        </div>

        {error && <div className="error">{error}</div>}

        <form className="detail-form" onSubmit={saveTask}>
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>
            Description
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <div className="row">
            <label>
              Status
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </label>
            <label>
              Priority
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </label>
            <label>
              Due date
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </label>
          </div>
          <div className="row">
            <button type="submit">Save</button>
            <button type="button" className="danger" onClick={deleteTask}>Delete task</button>
          </div>
        </form>

        <h3>Assignees</h3>
        <div className="chips">
          {members.length === 0 && <span className="muted">Add team members first</span>}
          {members.map((m) => (
            <button
              key={m.id}
              className={`chip toggle ${task.assignees.some((a) => a.id === m.id) ? "selected" : ""}`}
              onClick={() => toggleAssignee(m)}
            >
              <Avatar member={m} /> {m.name}
            </button>
          ))}
        </div>

        <h3>Labels</h3>
        <div className="chips">
          {labels.length === 0 && <span className="muted">Create some labels first</span>}
          {labels.map((l) => (
            <button
              key={l.id}
              className={`chip toggle ${task.labels.some((tl) => tl.id === l.id) ? "selected" : ""}`}
              onClick={() => toggleLabel(l)}
            >
              <span className="dot" style={{ background: l.color }} /> {l.name}
            </button>
          ))}
        </div>

        <h3>Comments</h3>
        {comments.length === 0 && <p className="muted">No comments yet</p>}
        {comments.map((c) => (
          <div key={c.id} className="comment">
            <div className="muted">
              <b>{c.profiles?.name}</b> · {new Date(c.created_at).toLocaleString()}
            </div>
            <p>{c.comment}</p>
          </div>
        ))}
        <form className="inline-form" onSubmit={addComment}>
          <input placeholder="Write a comment" value={comment} onChange={(e) => setComment(e.target.value)} />
          <button type="submit">Post</button>
        </form>

        <h3>Activity</h3>
        <ul className="activity">
          {activity.map((a) => (
            <li key={a.id}>
              {describeActivity(a)} <span className="muted">· {timeAgo(a.created_at)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default TaskDetail
