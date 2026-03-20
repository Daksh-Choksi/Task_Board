import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

export default function useTeamMembers(userId) {
  const [members, setMembers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);

  const fetchMembers = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase.from("team_members").select("*").eq("user_id", userId);
    if (!error) setMembers(data);
  }, [userId]);

  const addMember = async (member) => {
    const { data, error } = await supabase.from("team_members").insert([{ ...member, user_id: userId }]).select();
    if (!error) setMembers((prev) => [...prev, ...data]);
  };

  const fetchAllMembers = useCallback(async () => {
    const { data, error } = await supabase.from("team_members").select("*");
    if (!error) setAllMembers(data);
  }, []);

  useEffect(() => {
    if (userId) {
      setTimeout(() => {
        void fetchMembers();
      }, 0);
    }

    setTimeout(() => {
      void fetchAllMembers();
    }, 0);
  }, [userId, fetchAllMembers, fetchMembers]);

  return { members, fetchMembers, addMember, allMembers };
}
