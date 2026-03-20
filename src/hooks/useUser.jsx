import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [returningUser, setReturningUser] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (!error) setUser(data.user);
      } else {
        setUser(session.user);
        setReturningUser(true);
      }

      setLoading(false);
    }

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return { user, loading, returningUser };
}