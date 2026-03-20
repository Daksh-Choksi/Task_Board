import { useMemo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import TaskCard from "./taskCards";

function memberExists(selectedIds, candidateId) {
  return selectedIds.includes(String(candidateId));
}

function Columns({ column, tasks, addTask, updateTask, allMembers, deleteTask }) {
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [task, setTask] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("normal");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  const memberOptions = useMemo(
    () => allMembers?.filter((member) => !memberExists(selectedMemberIds, member.id)) ?? [],
    [allMembers, selectedMemberIds]
  );

  function closeComposer() {
    setTask("");
    setDescription("");
    setDueDate("");
    setPriority("normal");
    setSelectedMemberIds([]);
    setSelectedMemberId("");
    setIsComposerOpen(false);
  }

  function addSelectedMember() {
    if (!selectedMemberId) return;
    setSelectedMemberIds((prev) => (prev.includes(selectedMemberId) ? prev : [...prev, selectedMemberId]));
    setSelectedMemberId("");
  }

  function removeSelectedMember(memberId) {
    setSelectedMemberIds((prev) => prev.filter((id) => id !== String(memberId)));
  }

  async function addTasks(e) {
    e.preventDefault();

    await addTask({
      title: task,
      status: column.id,
      description,
      due_date: dueDate || null,
      priority,
      member_ids: selectedMemberIds,
    });

    closeComposer();
  }

  return (
    <section
      ref={setNodeRef}
      className={`column_card ${isOver ? "column_card__active" : ""}`}
      style={{ "--column-accent": column.accent }}
    >
      <header className="column_header">
        <div>
          <div className="column_title_row">
            <span className="column_accent_dot" />
            <h2>{column.title}</h2>
            <span className="task_count">{tasks.length}</span>
          </div>
          <p>{column.description}</p>
        </div>
        <button className="ghost_button" type="button" onClick={() => setIsComposerOpen((prev) => !prev)}>
          {isComposerOpen ? "Close" : "+ Add task"}
        </button>
      </header>

      {isComposerOpen ? (
        <form className="task_form" onSubmit={addTasks}>
          <input type="text" placeholder="What needs to get done?" value={task} onChange={(e) => setTask(e.target.value)} required />
          <textarea placeholder="Add context, links, or acceptance criteria." value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="task_form_grid">
            <label>
              <span>Due date</span>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </label>
            <label>
              <span>Priority</span>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>

          <label>
            <span>Assignees</span>
            <div className="assignee_picker_row assignee_picker_row__composer">
              <select value={selectedMemberId} onChange={(e) => setSelectedMemberId(e.target.value)}>
                <option value="">Select teammate</option>
                {memberOptions.map((member) => (
                  <option key={member.id} value={String(member.id)}>
                    {member.name}
                  </option>
                ))}
              </select>
              <button className="secondary_button" type="button" onClick={addSelectedMember}>
                Add person
              </button>
            </div>
          </label>

          <div className="assignee_token_list">
            {selectedMemberIds.length ? (
              selectedMemberIds.map((memberId) => {
                const member = allMembers.find((candidate) => String(candidate.id) === String(memberId));
                return (
                  <button
                    key={memberId}
                    type="button"
                    className="assignee_token assignee_token__pending"
                    onClick={() => removeSelectedMember(memberId)}
                  >
                    <span className="assignee_token__avatar" style={{ backgroundColor: member?.color || "#9aa6b2" }}>
                      {(member?.name || "N")
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                    <span>{member?.name || "New assignee"}</span>
                    <span className="assignee_token__remove">×</span>
                  </button>
                );
              })
            ) : (
              <span className="assignee_empty">No teammates added yet.</span>
            )}
          </div>

          <div className="task_form_actions">
            <button className="primary_button" type="submit">Create task</button>
            <button className="secondary_button" type="button" onClick={closeComposer}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="task_list">
        {tasks.length ? (
          tasks.map((taskItem) => (
            <TaskCard key={taskItem.id} task={taskItem} updateTasks={updateTask} allMembers={allMembers} deleteTask={deleteTask} />
          ))
        ) : (
          <div className="empty_state">
            <strong>Drop tasks here</strong>
            <span>Keep work flowing by dragging cards between columns.</span>
          </div>
        )}
      </div>
    </section>
  );
}

export default Columns;
