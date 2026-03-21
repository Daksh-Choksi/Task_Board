import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [returningUser, setReturningUser] = useState(false);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "INITIAL_SESSION") {
          if (session) {
            setUser(session.user);
            setReturningUser(true);
            setLoading(false);
          } else {
            const { data, error } = await supabase.auth.signInAnonymously();
            if (!error) setUser(data.user);
          }
        } else if (event === "SIGNED_IN") {
          setUser(session.user);
          setLoading(false);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  return { user, loading, returningUser };
}