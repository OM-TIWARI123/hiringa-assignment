import { useConvexAuth } from "convex/react";
import { Navigate } from "react-router-dom";

export function RequireAuth({ children }) {
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/signin" replace />;

  return children;
}