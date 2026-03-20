import { useMemo, useState } from "react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import useTaskAssignees from "../hooks/useTaskAssignees";

function getDueMeta(dueDate, status) {
  if (!dueDate) return { label: "No due date", tone: "neutral" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(`${dueDate}T00:00:00`);
  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

  if (status === "done") return {label: "Done", tone: "success"}
  if (status !== "done" && diffDays < 0) return { label: "Overdue", tone: "danger" };
  if (diffDays === 0) return { label: "Due today", tone: "warning" };
  if (diffDays <= 2) return { label: "Due soon", tone: "warning" };
  if (diffDays <= 7) return { label: "Upcoming", tone: "info" };
  return { label: "Has time", tone: "success" };
}

function formatDate(dateString) {
  if (!dateString) return "No due date";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${dateString}T00:00:00`));
}

function initials(name) {
  return name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function memberExists(existingAssignees, selectedIds, candidateId) {
  const normalizedId = String(candidateId);
  return existingAssignees.some((assignee) => String(assignee.member_id) === normalizedId) || selectedIds.includes(normalizedId);
}

function TaskCard({ task, updateTasks, allMembers = [], isOverlay = false, deleteTask }) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [pendingMemberIds, setPendingMemberIds] = useState([]);
  const [removedMemberIds, setRemovedMemberIds] = useState([]);
  const [formState, setFormState] = useState({
    title: task.title,
    description: task.description ?? "",
    priority: task.priority ?? "normal",
    due_date: task.due_date ?? "",
    task_assignees: task.task_assignees ?? [],
  });
  const { assignMembers, deleteMember } = useTaskAssignees();

  const sortable = useSortable({ id: String(task.id), data: { type: "task", task } });
  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
  };

  const dueMeta = useMemo(() => getDueMeta(task.due_date, task.status), [task.due_date, task.status]);
  const assignees = task.task_assignees ?? [];

  const selectableMembers = useMemo(
    () => allMembers.filter((member) => !memberExists(formState.task_assignees, pendingMemberIds, member.id)),
    [allMembers, formState.task_assignees, pendingMemberIds]
  );

  function startEditing() {
    setFormState({
      title: task.title,
      description: task.description ?? "",
      priority: task.priority ?? "normal",
      due_date: task.due_date ?? "",
      task_assignees: task.task_assignees ?? [],
    });
    setPendingMemberIds([]);
    setRemovedMemberIds([]);
    setSelectedMemberId("");
    setIsEditing(true);
  }

  function removeExistingAssignee(memberId) {
    setFormState((prev) => ({
      ...prev,
      task_assignees: prev.task_assignees.filter((assignee) => String(assignee.member_id) !== String(memberId)),
    }));
    setRemovedMemberIds((prev) => (prev.includes(String(memberId)) ? prev : [...prev, String(memberId)]));
  }

  function addPendingMember() {
    if (!selectedMemberId) return;
    setPendingMemberIds((prev) => (prev.includes(selectedMemberId) ? prev : [...prev, selectedMemberId]));
    setSelectedMemberId("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await updateTasks(task.id, {
      title: formState.title,
      description: formState.description,
      priority: formState.priority,
      due_date: formState.due_date,
    });

    if (pendingMemberIds.length) {
      await assignMembers(task.id, pendingMemberIds);
    }

    if (removedMemberIds.length) {
      await Promise.all(removedMemberIds.map((memberId) => deleteMember(task.id, memberId)));
    }

    setIsEditing(false);
  }

  if (isEditing && !isOverlay) {
    return (
      <form className="task_card task_card__editing" onSubmit={handleSubmit}>
        <div className="task_card_edit_heading">
          <strong>Edit task</strong>
          <span>Update details and manage collaborators.</span>
        </div>

        <input value={formState.title} onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))} required />
        <textarea value={formState.description} onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))} />
        <div className="task_form_grid">
          <label>
            <span>Priority</span>
            <select value={formState.priority} onChange={(e) => setFormState((prev) => ({ ...prev, priority: e.target.value }))}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
          </label>
          <label>
            <span>Due date</span>
            <input type="date" value={formState.due_date} onChange={(e) => setFormState((prev) => ({ ...prev, due_date: e.target.value }))} />
          </label>
        </div>

        <div className="edit_assignees_panel">
          <div className="edit_assignees_header">
            <div>
              <strong>Assignees</strong>
              <span>Add teammates or remove them from this task.</span>
            </div>
          </div>

          <div className="assignee_token_list">
            {formState.task_assignees.map((taskAssignee) => (
              <button
                key={taskAssignee.member_id}
                type="button"
                className="assignee_token"
                onClick={() => removeExistingAssignee(taskAssignee.member_id)}
              >
                <span
                  className="assignee_token__avatar"
                  style={{ backgroundColor: taskAssignee?.team_members?.color || "#9aa6b2" }}
                >
                  {initials(taskAssignee?.team_members?.name || "U")}
                </span>
                <span>{taskAssignee?.team_members?.name}</span>
                <span className="assignee_token__remove">×</span>
              </button>
            ))}

            {pendingMemberIds.map((memberId) => {
              const member = allMembers.find((candidate) => String(candidate.id) === String(memberId));
              return (
                <span key={memberId} className="assignee_token assignee_token__pending">
                  <span className="assignee_token__avatar" style={{ backgroundColor: member?.color || "#9aa6b2" }}>
                    {initials(member?.name || "N")}
                  </span>
                  <span>{member?.name || "New assignee"}</span>
                </span>
              );
            })}

            {formState.task_assignees.length === 0 && pendingMemberIds.length === 0 ? (
              <span className="assignee_empty">No one assigned yet.</span>
            ) : null}
          </div>

          <div className="assignee_picker_row">
            <select value={selectedMemberId} onChange={(e) => setSelectedMemberId(e.target.value)}>
              <option value="">Select teammate</option>
              {selectableMembers.map((member) => (
                <option key={member.id} value={String(member.id)}>
                  {member.name}
                </option>
              ))}
            </select>
            <button className="secondary_button" type="button" onClick={addPendingMember}>
              Add person
            </button>
          </div>
        </div>

        <div className="task_inline_actions">
          <button className="primary_button" type="submit">Save changes</button>
          <button className="secondary_button" type="button" onClick={() => setIsEditing(false)}>Cancel</button>
        </div>
      </form>
    );
  }

  return (
    <article
      ref={isOverlay ? undefined : sortable.setNodeRef}
      style={isOverlay ? undefined : style}
      className={`task_card ${isOverlay ? "task_card__overlay" : ""} ${sortable.isDragging ? "task_card__dragging" : ""}`}
      {...(!isOverlay ? sortable.attributes : {})}
      {...(!isOverlay ? sortable.listeners : {})}
    >
      <div className="task_card_top">
        <span className={`priority_pill priority_pill__${task.priority ?? "normal"}`}>{task.priority ?? "normal"}</span>
        <span className={`flag_pill flag_pill__${dueMeta.tone}`}>{dueMeta.label}</span>
      </div>

      <div className="task_card_body">
        <h3>{task.title}</h3>
        <p>{task.description || "No description added yet."}</p>
      </div>

      <div className="task_meta_row">
        <div>
          <span className="meta_label">Due date</span>
          <strong>{formatDate(task.due_date)}</strong>
        </div>
        <button className="icon_button" type="button" onClick={startEditing}>
          Edit
        </button>
        <button className="icon_button" type="button" onClick={() => deleteTask(task.id)}>Delete Task</button>
      </div>

      <div className="task_footer">
        <div className="avatar_group">
          {assignees.length ? (
            assignees.map((taskAssignee) => (
              <span
                key={taskAssignee.member_id}
                className="avatar_chip"
                style={{ backgroundColor: taskAssignee?.team_members?.color || "#cbd5e1" }}
                title={taskAssignee?.team_members?.name}
              >
                {initials(taskAssignee?.team_members?.name || "U")}
              </span>
            ))
          ) : (
            <span className="avatar_chip avatar_chip__empty">?</span>
          )}
        </div>
        <span className="assignee_label">
          {assignees.length ? `${assignees.length} teammate${assignees.length > 1 ? "s" : ""}` : "Unassigned"}
        </span>
      </div>
    </article>
  );
}

export default TaskCard;
