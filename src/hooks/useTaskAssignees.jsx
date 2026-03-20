import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function useTaskAssignees() {
  const [tasks, setTasks] = useState([]);

  const assignMembers = async (taskId, memberIds) => {
    const rows = memberIds.map((memberId) => ({
      task_id: taskId,
      member_id: memberId,
    }));

    const { error: assignError } = await supabase.from("task_assignees").insert(rows);
    if (assignError) console.error("Assign members error:", assignError);
  };

  const deleteMember = async (taskId, memberId) => {
    const { error } = await supabase.from("task_assignees").delete().eq("task_id", taskId).eq("member_id", memberId);

    if (error) console.error("Remove assignee error:", error);
  };

  const pullTasks = async () => {
    const { data } = await supabase.from("tasks").select(`
      *,
      task_assignees(
        team_members(*)
      )
    `);
    setTasks(data);
    return tasks;
  };

  return { assignMembers, pullTasks, deleteMember };
}
