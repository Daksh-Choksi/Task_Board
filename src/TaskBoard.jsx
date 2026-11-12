import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "./db"
import Avatar from "./Avatar"
import TaskDetail from "./TaskDetail"
import { COLUMNS, dueCategory, dueStatus } from "./utils"

const TASK_QUERY = "*, task_assignees (member:team_members (id, name, color, avatar_url)), task_labels (label:labels (id, name, color))"

async function currentUserId() {
  const { data } = await supabase.auth.getSession()
  return data.session?.user.id
}

function TaskCard({ task, shared, onOpen }) {
  const due = dueStatus(task)

  return (
    <div
      className={`card priority-${task.priority}`}
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", task.id)}
      onClick={onOpen}
    >
      {task.labels.length > 0 && (
        <div className="card-labels">
          {task.labels.map((l) => (
            <span key={l.id} className="label" style={{ background: l.color }}>{l.name}</span>
          ))}
        </div>
      )}
      {shared && <div className="shared">Assigned to you</div>}
      <p className="card-title">{task.title}</p>
      <div className="card-footer">
        <span className={`priority priority-${task.priority}`}>{task.priority}</span>
        {due && <span className={`due ${due.className}`}>{due.text}</span>}
        <div className="avatars">
          {task.assignees.map((m) => <Avatar key={m.id} member={m} />)}
        </div>
      </div>
    </div>
  )
}

function TaskBoard() {
  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [labels, setLabels] = useState([])
  const [error, setError] = useState("")
  const [labelFilter, setLabelFilter] = useState("")
  const [dueFilter, setDueFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")
  const [selectedId, setSelectedId] = useState(null)
  const [dragOver, setDragOver] = useState(null)

  const [title, setTitle] = useState("")
  const [priority, setPriority] = useState("normal")
  const [dueDate, setDueDate] = useState("")

  const [memberName, setMemberName] = useState("")
  const [memberColor, setMemberColor] = useState("#6366f1")
  const [suggestions, setSuggestions] = useState([])
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [searching, setSearching] = useState(false)
  const searchTimer = useRef(null)
  const latestSearch = useRef("")
  const [labelName, setLabelName] = useState("")
  const [labelColor, setLabelColor] = useState("#64748b")

  const [name, setName] = useState("")
  const [userId, setUserId] = useState(null)
  const navigate = useNavigate()

  async function getTasks() {
    const { data, error } = await supabase.from("tasks").select(TASK_QUERY).order("created_at")
    if (error) return setError(error.message)
    setTasks(data.map((t) => ({
      ...t,
      assignees: t.task_assignees.map((a) => a.member),
      labels: t.task_labels.map((l) => l.label),
    })))
  }

  async function getMembers() {
    const uid = await currentUserId()
    const { data, error } = await supabase.from("team_members").select("*").eq("user_id", uid).order("created_at")
    if (error) return setError(error.message)
    setMembers(data)
  }

  async function getLabels() {
    const uid = await currentUserId()
    const { data, error } = await supabase.from("labels").select("*").eq("user_id", uid).order("name")
    if (error) return setError(error.message)
    setLabels(data)
  }

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession()
      if (!data.session) return navigate("/")
      const uid = data.session.user.id
      setUserId(uid)
      const { data: profile } = await supabase.from("profiles").select("name").eq("id", uid).single()
      if (profile) setName(profile.name)
      getTasks()
      getMembers()
      getLabels()
    }
    init()
  }, [navigate])

  async function addTask(e) {
    e.preventDefault()
    if (!title.trim()) return

    const { error } = await supabase.from("tasks").insert({ title: title.trim(), priority, due_date: dueDate || null })
    if (error) return setError(error.message)

    setTitle("")
    setPriority("normal")
    setDueDate("")
    getTasks()
  }

  async function moveTask(id, status) {
    const task = tasks.find((t) => t.id === id)
    if (!task || task.status === status) return

    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
    const { error } = await supabase.from("tasks").update({ status }).eq("id", id)
    if (error) {
      setError(error.message)
      getTasks()
    }
  }

  function searchProfiles(value) {
    setMemberName(value)
    setSelectedProfile(null)
    clearTimeout(searchTimer.current)

    const query = value.trim()
    latestSearch.current = query
    if (!query) {
      setSearching(false)
      return setSuggestions([])
    }

    setSearching(true)
    searchTimer.current = setTimeout(async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name")
        .ilike("name", `%${query.replace(/[%_\\]/g, "\\$&")}%`)
        .order("name")
        .limit(5)
      if (latestSearch.current !== query) return
      setSearching(false)
      if (error) return setError(error.message)
      setSuggestions(data.filter((p) => !members.some((m) => m.profile_id === p.id)))
    }, 250)
  }

  function pickProfile(profile) {
    setSelectedProfile(profile)
    setMemberName(profile.name)
    setSuggestions([])
  }

  async function addMember(e) {
    e.preventDefault()
    if (!selectedProfile) return setError("Pick a person from the list")

    const { error } = await supabase.from("team_members").insert({ name: selectedProfile.name, profile_id: selectedProfile.id, color: memberColor })
    if (error) return setError(error.message)
    setMemberName("")
    setSelectedProfile(null)
    getMembers()
  }

  async function deleteMember(id) {
    const { error } = await supabase.from("team_members").delete().eq("id", id)
    if (error) return setError(error.message)
    getMembers()
    getTasks()
  }

  async function addLabel(e) {
    e.preventDefault()
    if (!labelName.trim()) return

    const { error } = await supabase.from("labels").insert({ name: labelName.trim(), color: labelColor })
    if (error) return setError(error.message)
    setLabelName("")
    getLabels()
  }

  async function deleteLabel(id) {
    const { error } = await supabase.from("labels").delete().eq("id", id)
    if (error) return setError(error.message)
    if (labelFilter === id) setLabelFilter("")
    getLabels()
    getTasks()
  }

  async function signOut() {
    await supabase.auth.signOut()
    navigate("/")
  }

  const visibleTasks = tasks.filter((t) =>
    (!labelFilter || t.labels.some((l) => l.id === labelFilter)) &&
    (!dueFilter || dueCategory(t) === dueFilter) &&
    (!priorityFilter || t.priority === priorityFilter)
  )
  const hasFilters = labelFilter || dueFilter || priorityFilter

  function clearFilters() {
    setLabelFilter("")
    setDueFilter("")
    setPriorityFilter("")
  }
  const selectedTask = tasks.find((t) => t.id === selectedId)

  return (
    <div className="app">
      <header className="header">
        <h1>Task Board</h1>
        <div className="header-right">
          <span className="muted">Hi, {name}</span>
          <button className="secondary" onClick={signOut}>Sign out</button>
        </div>
      </header>

      {error && <div className="error" onClick={() => setError("")}>{error} (click to dismiss)</div>}

      <section className="panels">
        <div className="panel">
          <h3>New task</h3>
          <form className="inline-form" onSubmit={addTask}>
            <input placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <button type="submit">Add</button>
          </form>
        </div>

        <div className="panel">
          <h3>Team</h3>
          <div className="chips">
            {members.map((m) => (
              <span key={m.id} className="chip">
                <Avatar member={m} /> {m.name}
                <button className="remove" onClick={() => deleteMember(m.id)}>×</button>
              </span>
            ))}
          </div>
          <form className="inline-form" onSubmit={addMember}>
            <div className="autocomplete">
              <input placeholder="Search people" value={memberName} onChange={(e) => searchProfiles(e.target.value)} />
              {memberName.trim() && !selectedProfile && (
                <ul className="suggestions">
                  {searching && <li className="muted">Searching...</li>}
                  {!searching && suggestions.length === 0 && <li className="muted">No matching people</li>}
                  {suggestions.map((p) => (
                    <li key={p.id} className="suggestion" onClick={() => pickProfile(p)}>{p.name}</li>
                  ))}
                </ul>
              )}
            </div>
            <input type="color" value={memberColor} onChange={(e) => setMemberColor(e.target.value)} />
            <button type="submit" disabled={!selectedProfile}>Add</button>
          </form>
        </div>

        <div className="panel">
          <h3>Labels</h3>
          <div className="chips">
            {labels.map((l) => (
              <span key={l.id} className="label" style={{ background: l.color }}>
                {l.name}
                <button className="remove" onClick={() => deleteLabel(l.id)}>×</button>
              </span>
            ))}
          </div>
          <form className="inline-form" onSubmit={addLabel}>
            <input placeholder="Label name" value={labelName} onChange={(e) => setLabelName(e.target.value)} />
            <input type="color" value={labelColor} onChange={(e) => setLabelColor(e.target.value)} />
            <button type="submit">Add</button>
          </form>
        </div>
      </section>

      <div className="filter">
        <span>Filter:</span>
        <select value={labelFilter} onChange={(e) => setLabelFilter(e.target.value)}>
          <option value="">All labels</option>
          {labels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select value={dueFilter} onChange={(e) => setDueFilter(e.target.value)}>
          <option value="">Any due date</option>
          <option value="overdue">Overdue</option>
          <option value="soon">Due soon (next 2 days)</option>
          <option value="later">Plenty of time</option>
          <option value="none">No due date</option>
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">Any priority</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
        {hasFilters && <button className="secondary" onClick={clearFilters}>Clear</button>}
      </div>

      <main className="board">
        {COLUMNS.map((col) => {
          const columnTasks = visibleTasks.filter((t) => t.status === col.id)
          return (
            <div
              key={col.id}
              className={`column ${dragOver === col.id ? "drag-over" : ""}`}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(col.id)
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(null)
              }}
              onDrop={(e) => {
                setDragOver(null)
                moveTask(e.dataTransfer.getData("text/plain"), col.id)
              }}
            >
              <h4>{col.title} <span className="count">{columnTasks.length}</span></h4>
              {columnTasks.map((task) => (
                <TaskCard key={task.id} task={task} shared={task.user_id !== userId} onOpen={() => setSelectedId(task.id)} />
              ))}
            </div>
          )
        })}
      </main>

      {selectedTask && (
        <TaskDetail
          key={selectedTask.id}
          task={selectedTask}
          isOwner={selectedTask.user_id === userId}
          members={members}
          labels={labels}
          onClose={() => setSelectedId(null)}
          onChange={getTasks}
        />
      )}
    </div>
  )
}

export default TaskBoard
