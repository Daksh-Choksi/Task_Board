import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

export default function useTasks(userId) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data: member } = await supabase.from("team_members").select("id").eq("user_id", userId).maybeSingle();
    const memberId = member?.id;

    const { data: ownTasks, error: ownError } = await supabase
      .from("tasks")
      .select(`
        *,
        task_assignees(
          member_id,
          team_members(id, name, color)
        )
      `)
      .eq("user_id", userId);

    if (ownError) {
      console.error("Own tasks fetch error:", ownError);
      setLoading(false);
      return;
    }

    let assignedTasks = [];
    if (memberId) {
      const { data: assignedRaw, error: assignedError } = await supabase
        .from("tasks")
        .select(`
          *,
          task_assignees!inner(member_id)
        `)
        .eq("task_assignees.member_id", memberId)
        .neq("user_id", userId);

      if (assignedError) {
        console.error("Assigned tasks fetch error:", assignedError);
      } else {
        assignedTasks = (assignedRaw || []).map((rawTask) => {
          const task = { ...rawTask };
          delete task.task_assignees;
          return { ...task, task_assignees: [] };
        });
      }
    }

    const ownIds = new Set((ownTasks || []).map((task) => task.id));
    const merged = [...(ownTasks || []), ...assignedTasks.filter((task) => !ownIds.has(task.id))];

    setTasks(merged);
    setLoading(false);
  }, [userId]);

  const addTask = async (task) => {
    const { member_ids: memberIds = [], ...taskPayload } = task;

    const { data, error } = await supabase.from("tasks").insert([{ ...taskPayload, user_id: userId }]).select();

    if (error) {
      console.error("Add task error:", error);
      return null;
    }

    const createdTask = { ...data[0], task_assignees: [] };

    if (memberIds.length) {
      const { error: assigneeError } = await supabase.from("task_assignees").insert(
        memberIds.map((memberId) => ({
          task_id: createdTask.id,
          member_id: memberId,
        }))
      );

      if (assigneeError) {
        console.error("Add assignees error:", assigneeError);
      }
    }

    await fetchTasks();
    return createdTask;
  };

  const updateTask = async (id, updates) => {
    const { error } = await supabase.from("tasks").update(updates).eq("id", id);

    if (error) {
      console.error("Update task error:", error);
      return;
    }

    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, ...updates } : task)));
  };

  const deleteTask = async (id) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      console.error("Delete task error:", error);
      return;
    }

    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    if (!userId) return;

    setTimeout(() => {
      void fetchTasks();
    }, 0);

    const channel = supabase
      .channel(`tasks-user-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => fetchTasks())
      .on("postgres_changes", { event: "*", schema: "public", table: "task_assignees" }, () => fetchTasks())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId, fetchTasks]);

  return { tasks, loading, addTask, updateTask, fetchTasks, deleteTask };
}
