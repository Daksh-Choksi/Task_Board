import { useMemo, useState } from "react";
import { DndContext, DragOverlay, PointerSensor, closestCorners, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import Columns from "./columns";
import TaskCard from "./taskCards";
import { COLUMN_CONFIG } from "./columnConfig";


function Board({ tasks, addTask, updateTask, members, addMember, allMembers, deleteTask }) {
  const [activeTask, setActiveTask] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const groupedTasks = useMemo(
    () =>
      COLUMN_CONFIG.reduce((acc, column) => {
        acc[column.id] = tasks.filter((task) => task.status === column.id);
        return acc;
      }, {}),
    [tasks]
  );

  const boardMetrics = useMemo(() => {
    const overdue = tasks.filter((task) => {
      if (!task.due_date) return false;
      const due = new Date(`${task.due_date}T23:59:59`);
      const now = new Date();
      return due < now && task.status !== "done";
    }).length;

    return {
      total: tasks.length,
      completed: groupedTasks.done?.length ?? 0,
      overdue,
    };
  }, [groupedTasks, tasks]);

  const findTask = (taskId) => tasks.find((task) => String(task.id) === String(taskId));

  async function handleDragEnd(event) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const activeTaskItem = findTask(activeId);
    if (!activeTaskItem) return;

    const overTask = findTask(overId);
    const nextStatus = overTask?.status || overId;

    if (!nextStatus || nextStatus === activeTaskItem.status) return;
    await updateTask(activeTaskItem.id, { status: nextStatus });
  }

  return (
    <main className="app_shell">
      <section className="hero_panel">
        <div>
          <span className="eyebrow">Task flow</span>
          <h1>Plan, focus, and ship work with a polished board.</h1>
          <p>
            A modern workspace with clear priorities, visual due-date signals,
            and drag-and-drop task movement across every delivery stage.
          </p>
        </div>

        <div className="hero_stats">
          <article>
            <span>Total tasks</span>
            <strong>{boardMetrics.total}</strong>
          </article>
          <article>
            <span>Completed</span>
            <strong>{boardMetrics.completed}</strong>
          </article>
          <article>
            <span>Need attention</span>
            <strong>{boardMetrics.overdue}</strong>
          </article>
        </div>
      </section>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={({ active }) => setActiveTask(findTask(active.id))}
        onDragCancel={() => setActiveTask(null)}
        onDragEnd={handleDragEnd}
      >
        <div className="board_grid">
          {COLUMN_CONFIG.map((column) => (
            <SortableContext
              key={column.id}
              items={groupedTasks[column.id].map((task) => String(task.id))}
              strategy={verticalListSortingStrategy}
            >
              <Columns
                column={column}
                tasks={groupedTasks[column.id]}
                addTask={addTask}
                updateTask={updateTask}
                members={members}
                addMember={addMember}
                allMembers={allMembers}
                deleteTask={deleteTask}
              />
            </SortableContext>
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} allMembers={allMembers} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </main>
  );
}

export default Board;
