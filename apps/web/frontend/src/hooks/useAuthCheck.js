import { useEffect, useState } from "react";
import axios from "../api/axios";

export default function useAuthCheck() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      try {
        const res = await axios.get("/auth/me", { withCredentials: true });
        if (isMounted) {
          setUser(res.data); // directly assign the object returned by backend
        }
      } catch (err) {
        if (isMounted) setUser(null); // not logged in or error
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, []);

  return { user, loading };
}
