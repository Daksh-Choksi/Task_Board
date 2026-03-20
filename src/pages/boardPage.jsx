import useTasks from "../hooks/useTasks";
import useTeamMembers from "../hooks/useTeamMembers";
import Board from "../Board/board";

function BoardPage({ user }) {
  const { tasks, addTask, updateTask, loading, deleteTask } = useTasks(user.id);
  const { members, addMember, allMembers } = useTeamMembers(user.id);

  if (loading) {
    return <div className="loading_screen">Loading your workspace…</div>;
  }

  return (
    <Board
      tasks={tasks}
      addTask={addTask}
      updateTask={updateTask}
      members={members}
      addMember={addMember}
      allMembers={allMembers}
      deleteTask={deleteTask}
    />
  );
}

export default BoardPage;
