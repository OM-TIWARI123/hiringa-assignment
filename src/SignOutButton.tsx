"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-muted-foreground"
      onClick={() => void signOut()}
      title="Sign out"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
