import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/** Renders children only for a server-verified signed-in user; otherwise sends to /auth. */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [state, setState] = useState<"checking" | "in" | "out">("checking");

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      setState(!error && data.user ? "in" : "out");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) setState("out");
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [location.pathname]);

  if (state === "checking") {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Checking sign-in…</div>;
  }
  if (state === "out") return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
};

export default ProtectedRoute;
